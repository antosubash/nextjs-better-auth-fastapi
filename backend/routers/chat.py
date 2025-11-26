"""Chat API routes."""

from collections.abc import AsyncGenerator
from dataclasses import dataclass
from datetime import UTC, datetime
import json
import logging
from uuid import UUID

from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from core.constants import ErrorMessages
from core.database import get_session
from core.exceptions import AppException
from schemas.chat import (
    ChatRequest,
    ConversationListResponse,
    ConversationResponse,
    CreateConversationRequest,
    MessageResponse,
    ModelsListResponse,
    UpdateConversationRequest,
)
from services.chat_service import ChatService
from services.conversation_service import ConversationService


@dataclass
class ChatContext:
    """Context for chat operations."""

    chat_service: ChatService
    conversation_service: ConversationService
    session: AsyncSession
    user_id: str
    model_name: str


@dataclass
class StreamState:
    """State for streaming response."""

    assistant_content: str = ""
    chunk_id: int = 0
    assistant_message_id: UUID | None = None
    done: bool = False


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])


def validate_chat_request(chat_request: ChatRequest) -> list[dict[str, str]]:
    """Validate chat request and convert messages to dict format."""
    if not chat_request.messages:
        raise AppException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Messages are required",
        )

    messages = [{"role": msg.role, "content": msg.content} for msg in chat_request.messages]

    # Add system prompt if provided
    if chat_request.system_prompt:
        messages.insert(0, {"role": "system", "content": chat_request.system_prompt})

    return messages


async def save_user_messages(
    context: ChatContext,
    chat_request: ChatRequest,
) -> UUID | None:
    """Save only the last new user message to conversation if conversation_id is provided.

    Returns:
        Saved message ID if message was saved, None otherwise
    """
    if not chat_request.conversation_id:
        logger.debug("No conversation_id provided, skipping message save")
        return None

    try:
        # Lock conversation to prevent race conditions
        await context.conversation_service.get_conversation_for_update(
            session=context.session,
            conversation_id=chat_request.conversation_id,
            user_id=context.user_id,
        )

        # Find the last user message in the request (this is the new one being sent)
        last_user_message = None
        for msg in reversed(chat_request.messages):
            if msg.role == "user":
                last_user_message = msg
                break

        if not last_user_message:
            logger.debug("No user messages in request, skipping save")
            return None

        # Get existing messages from the conversation to check for duplicates
        existing_messages = await context.conversation_service.get_conversation_messages(
            session=context.session,
            conversation_id=chat_request.conversation_id,
            user_id=context.user_id,
        )

        # Check if the last user message in the database matches the one being sent
        # This prevents duplicate saves from rapid clicks or race conditions
        user_messages = [msg for msg in existing_messages if msg.role == "user"]
        if user_messages:
            last_saved_user_message = user_messages[-1]  # Last user message (ordered by created_at)
            time_diff = (datetime.now(UTC) - last_saved_user_message.created_at).total_seconds()

            # If the last saved user message has the same content and was created recently (within 5 seconds),
            # skip saving to prevent duplicates from rapid duplicate requests
            if last_saved_user_message.content == last_user_message.content and time_diff < 5.0:
                logger.debug(
                    f"User message already exists in conversation {chat_request.conversation_id} "
                    f"(last saved {time_diff:.2f}s ago), skipping save"
                )
                return last_saved_user_message.id

        # Message doesn't exist or is different, save it
        message = await context.conversation_service.add_message(
            session=context.session,
            conversation_id=chat_request.conversation_id,
            user_id=context.user_id,
            message_data={
                "role": last_user_message.role,
                "content": last_user_message.content,
                "model": None,
            },
        )
        logger.info(
            f"Saved new user message {message.id} to conversation {chat_request.conversation_id}"
        )
    except AppException as e:
        logger.warning(
            f"Conversation {chat_request.conversation_id} not found or error saving user message: {e!s}",
            exc_info=True,
        )
        return None
    except Exception as e:
        logger.error(
            f"Unexpected error saving user message: {e!s}",
            exc_info=True,
        )
        return None
    else:
        return message.id


async def auto_update_conversation_title(
    context: ChatContext,
    conversation_id: UUID,
) -> None:
    """
    Automatically update conversation title from first user message if still using default.

    Args:
        context: Chat context
        conversation_id: Conversation ID
    """
    try:
        # Get conversation to check current title
        conversation = await context.conversation_service.get_conversation(
            session=context.session,
            conversation_id=conversation_id,
            user_id=context.user_id,
        )
        if not conversation:
            return

        # Only update if title is still the default
        default_titles = ["New Conversation", "new conversation"]
        if conversation.title not in default_titles:
            return

        # Get messages to find first user message
        messages = await context.conversation_service.get_conversation_messages(
            session=context.session,
            conversation_id=conversation_id,
            user_id=context.user_id,
        )

        # Find first user message
        first_user_message = None
        for msg in messages:
            if msg.role == "user":
                first_user_message = msg
                break

        if not first_user_message:
            return

        # Generate title from first user message
        new_title = context.conversation_service.generate_conversation_title(
            first_user_message.content
        )

        # Update conversation title
        await context.conversation_service.update_conversation(
            session=context.session,
            conversation_id=conversation_id,
            user_id=context.user_id,
            title=new_title,
        )
        logger.info(f"Auto-updated conversation {conversation_id} title to: {new_title}")
    except Exception as e:
        # Don't fail if title update fails, just log it
        logger.warning(
            f"Failed to auto-update conversation title for {conversation_id}: {e!s}",
            exc_info=True,
        )


async def save_assistant_message_if_new(
    context: ChatContext,
    conversation_id: UUID,
    assistant_content: str,
    model_name: str,
) -> UUID | None:
    """
    Save assistant message only if it doesn't already exist.

    Args:
        context: Chat context
        conversation_id: Conversation ID
        assistant_content: Assistant message content
        model_name: Model name

    Returns:
        Saved message ID if message was saved, None if it already existed or save failed
    """
    if not conversation_id or not assistant_content:
        return None

    try:
        # Lock conversation to prevent race conditions
        await context.conversation_service.get_conversation_for_update(
            session=context.session,
            conversation_id=conversation_id,
            user_id=context.user_id,
        )

        # Get existing messages to check for duplicates
        existing_messages = await context.conversation_service.get_conversation_messages(
            session=context.session,
            conversation_id=conversation_id,
            user_id=context.user_id,
        )

        # Check if this exact assistant message already exists
        for msg in existing_messages:
            if (
                msg.role == "assistant"
                and msg.content == assistant_content
                and msg.model == model_name
            ):
                logger.debug(
                    f"Assistant message already exists in conversation {conversation_id}, skipping save"
                )
                return msg.id

        # Message doesn't exist, save it
        message = await context.conversation_service.add_message(
            session=context.session,
            conversation_id=conversation_id,
            user_id=context.user_id,
            message_data={
                "role": "assistant",
                "content": assistant_content,
                "model": model_name,
            },
        )
        logger.info(f"Saved new assistant message {message.id} to conversation {conversation_id}")

        # Auto-update conversation title after first assistant message
        await auto_update_conversation_title(context, conversation_id)
    except AppException as e:
        logger.error(
            f"Failed to save assistant message to conversation {conversation_id}: {e!s}",
            exc_info=True,
        )
        return None
    except Exception as e:
        logger.error(
            f"Unexpected error saving assistant message: {e!s}",
            exc_info=True,
        )
        return None
    else:
        return message.id


def _create_thinking_response(thinking: str, chunk_id: int) -> str:
    """Create thinking response for AI SDK."""
    thinking_data = {
        "thinking": thinking,
        "messageId": f"chatcmpl-{chunk_id}",
    }
    return f":thinking {json.dumps(thinking_data, ensure_ascii=False)}\n"


def _create_ai_sdk_chunk(content: str, chunk_id: int, model_name: str) -> str:
    """Create AI SDK compatible chunk."""
    ai_sdk_chunk = {
        "id": f"chatcmpl-{chunk_id}",
        "object": "chat.completion.chunk",
        "created": int(datetime.now(UTC).timestamp()),
        "model": model_name,
        "choices": [
            {
                "index": 0,
                "delta": {"content": content},
                "finish_reason": None,
            }
        ],
    }
    return f"data: {json.dumps(ai_sdk_chunk, ensure_ascii=False)}\n\n"


def _create_final_chunk(chunk_id: int, model_name: str) -> str:
    """Create final chunk for streaming response."""
    final_chunk = {
        "id": f"chatcmpl-{chunk_id}",
        "object": "chat.completion.chunk",
        "created": int(datetime.now(UTC).timestamp()),
        "model": model_name,
        "choices": [
            {
                "index": 0,
                "delta": {},
                "finish_reason": "stop",
            }
        ],
    }
    return f"data: {json.dumps(final_chunk)}\n\n"


def _create_message_ids_response(
    user_message_id: UUID | None, assistant_message_id: UUID | None
) -> str:
    """Create message IDs response."""
    message_ids_data = {}
    if user_message_id:
        message_ids_data["user_message_id"] = str(user_message_id)
    if assistant_message_id:
        message_ids_data["assistant_message_id"] = str(assistant_message_id)
    return f":message_ids {json.dumps(message_ids_data, ensure_ascii=False)}\n"


async def _process_chunk_data(
    data: dict,
    context: ChatContext,
    chat_request: ChatRequest,
    state: StreamState,
    user_message_id: UUID | None,
) -> str:
    """Process chunk data and return responses."""
    content = data.get("content", "")
    thinking = data.get("thinking")
    done = data.get("done", False)
    responses = []

    if thinking:
        try:
            responses.append(_create_thinking_response(thinking, state.chunk_id))
        except (TypeError, ValueError) as e:
            logger.warning(f"Failed to encode thinking data: {e!s}")

    if content and content.strip():
        try:
            responses.append(_create_ai_sdk_chunk(content, state.chunk_id, context.model_name))
            state.chunk_id += 1
        except (TypeError, ValueError) as e:
            logger.warning(f"Failed to encode chunk: {e!s}")

    if done:
        state.done = True
        await _handle_stream_completion(context, chat_request, state, user_message_id, responses)

    return "".join(responses)


async def _handle_stream_completion(
    context: ChatContext,
    chat_request: ChatRequest,
    state: StreamState,
    user_message_id: UUID | None,
    responses: list[str],
) -> None:
    """Handle stream completion and message saving."""
    if chat_request.conversation_id and state.assistant_content and not state.assistant_message_id:
        state.assistant_message_id = await save_assistant_message_if_new(
            context=context,
            conversation_id=chat_request.conversation_id,
            assistant_content=state.assistant_content,
            model_name=context.model_name,
        )

    if user_message_id or state.assistant_message_id:
        try:
            responses.append(
                _create_message_ids_response(user_message_id, state.assistant_message_id)
            )
        except (TypeError, ValueError) as e:
            logger.warning(f"Failed to encode message IDs: {e!s}")

    responses.append(_create_final_chunk(state.chunk_id, context.model_name))
    responses.append("data: [DONE]\n\n")


async def generate_streaming_response(
    context: ChatContext,
    messages: list[dict[str, str]],
    chat_request: ChatRequest,
    user_message_id: UUID | None = None,
) -> AsyncGenerator[str, None]:
    """Generator function for streaming responses in AI SDK-compatible format."""
    state = StreamState()

    try:
        async for chunk in context.chat_service.stream_chat(
            messages=messages, model=chat_request.model
        ):
            if not chunk.startswith("data: "):
                continue

            try:
                json_str = chunk[6:].strip()
                if not json_str:
                    continue

                data = json.loads(json_str)
                content = data.get("content", "")
                if content and content.strip():
                    state.assistant_content += content

                response = await _process_chunk_data(
                    data, context, chat_request, state, user_message_id
                )

                if response:
                    yield response

                if state.done:
                    break
            except json.JSONDecodeError as e:
                logger.warning(f"Failed to parse SSE chunk JSON: {e!s}, chunk: {chunk[:100]}")
                continue
            except Exception as e:
                logger.warning(f"Error processing SSE chunk: {e!s}, chunk: {chunk[:100]}")
                continue

        final_response = await _finalize_stream(context, chat_request, state, user_message_id)
        if final_response:
            yield final_response
    except Exception as e:
        await _handle_stream_error(context, chat_request, state, e)
        raise


async def _finalize_stream(
    context: ChatContext,
    chat_request: ChatRequest,
    state: StreamState,
    user_message_id: UUID | None,
) -> str | None:
    """Finalize stream by saving message and sending IDs if needed."""
    # Save message if stream ended without done flag but we have content
    if chat_request.conversation_id and state.assistant_content and not state.assistant_message_id:
        state.assistant_message_id = await save_assistant_message_if_new(
            context=context,
            conversation_id=chat_request.conversation_id,
            assistant_content=state.assistant_content,
            model_name=context.model_name,
        )

    # Send message IDs at the end if not already sent
    if (user_message_id or state.assistant_message_id) and not state.done:
        try:
            return _create_message_ids_response(user_message_id, state.assistant_message_id)
        except (TypeError, ValueError) as e:
            logger.warning(f"Failed to encode message IDs: {e!s}")
    return None


async def _handle_stream_error(
    context: ChatContext,
    chat_request: ChatRequest,
    state: StreamState,
    error: Exception,
) -> None:
    """Handle stream error by attempting to save message."""
    logger.error(f"Error in streaming response: {error!s}", exc_info=True)
    # Try to save message even if there was an error
    if chat_request.conversation_id and state.assistant_content and not state.assistant_message_id:
        state.assistant_message_id = await save_assistant_message_if_new(
            context=context,
            conversation_id=chat_request.conversation_id,
            assistant_content=state.assistant_content,
            model_name=context.model_name,
        )


@router.post(
    "/",
    summary="Chat with LLM",
    description="Stream chat responses from Ollama LLM. Accessible to all authenticated users.",
)
async def chat(
    chat_request: ChatRequest,
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> StreamingResponse:
    """
    Stream chat responses from Ollama.

    Args:
        chat_request: Chat request with messages and model
        request: FastAPI request object
        session: Database session

    Returns:
        StreamingResponse with SSE formatted chat responses
    """
    user_id = request.state.user_id
    logger.info(
        f"Chat request from user {user_id}, conversation_id: {chat_request.conversation_id}"
    )

    messages = validate_chat_request(chat_request)

    context = ChatContext(
        chat_service=ChatService(),
        conversation_service=ConversationService(),
        session=session,
        user_id=user_id,
        model_name=chat_request.model or "qwen3:8b",
    )

    user_message_id = await save_user_messages(context, chat_request)

    return StreamingResponse(
        generate_streaming_response(context, messages, chat_request, user_message_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# Register route without trailing slash to handle /chat (not just /chat/)
router.add_api_route(
    "",
    chat,
    methods=["POST"],
    include_in_schema=False,
)


@router.get(
    "/conversations",
    summary="List conversations",
    description="Get list of conversations for the authenticated user.",
    response_model=ConversationListResponse,
)
async def list_conversations(
    request: Request,
    limit: int = 100,
    offset: int = 0,
    session: AsyncSession = Depends(get_session),
) -> ConversationListResponse:
    """
    List conversations for the authenticated user.

    Args:
        request: FastAPI request object
        limit: Maximum number of conversations to return
        offset: Number of conversations to skip
        session: Database session

    Returns:
        List of conversations
    """
    user_id = request.state.user_id
    conversation_service = ConversationService()
    conversations, total = await conversation_service.list_conversations(
        session=session, user_id=user_id, limit=limit, offset=offset
    )
    return ConversationListResponse(
        conversations=[
            ConversationResponse(
                id=conv.id,
                user_id=conv.user_id,
                title=conv.title,
                created_at=conv.created_at,
                updated_at=conv.updated_at,
                messages=None,
            )
            for conv in conversations
        ],
        total=total,
    )


@router.post(
    "/conversations",
    summary="Create conversation",
    description="Create a new conversation.",
    response_model=ConversationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_conversation(
    request: Request,
    conversation_request: CreateConversationRequest,
    session: AsyncSession = Depends(get_session),
) -> ConversationResponse:
    """
    Create a new conversation.

    Args:
        request: FastAPI request object
        conversation_request: Conversation creation request
        session: Database session

    Returns:
        Created conversation
    """
    user_id = request.state.user_id
    conversation_service = ConversationService()
    conversation = await conversation_service.create_conversation(
        session=session, user_id=user_id, title=conversation_request.title
    )
    return ConversationResponse(
        id=conversation.id,
        user_id=conversation.user_id,
        title=conversation.title,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        messages=None,
    )


@router.get(
    "/conversations/{conversation_id}",
    summary="Get conversation",
    description="Get a conversation with its messages.",
    response_model=ConversationResponse,
)
async def get_conversation(
    request: Request,
    conversation_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> ConversationResponse:
    """
    Get a conversation with its messages.

    Args:
        request: FastAPI request object
        conversation_id: Conversation ID
        session: Database session

    Returns:
        Conversation with messages
    """
    user_id = request.state.user_id
    conversation_service = ConversationService()
    conversation = await conversation_service.get_conversation(
        session=session, conversation_id=conversation_id, user_id=user_id
    )
    if not conversation:
        raise AppException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=ErrorMessages.CONVERSATION_NOT_FOUND,
        )

    # Get messages
    messages = await conversation_service.get_conversation_messages(
        session=session, conversation_id=conversation_id, user_id=user_id
    )

    return ConversationResponse(
        id=conversation.id,
        user_id=conversation.user_id,
        title=conversation.title,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        messages=[
            MessageResponse(
                id=msg.id,
                conversation_id=msg.conversation_id,
                role=msg.role,
                content=msg.content,
                model=msg.model,
                created_at=msg.created_at,
            )
            for msg in messages
        ],
    )


@router.patch(
    "/conversations/{conversation_id}",
    summary="Update conversation",
    description="Update a conversation (title).",
    response_model=ConversationResponse,
)
async def update_conversation(
    request: Request,
    conversation_id: UUID,
    conversation_request: UpdateConversationRequest,
    session: AsyncSession = Depends(get_session),
) -> ConversationResponse:
    """
    Update a conversation.

    Args:
        request: FastAPI request object
        conversation_id: Conversation ID
        conversation_request: Conversation update request
        session: Database session

    Returns:
        Updated conversation
    """
    user_id = request.state.user_id
    conversation_service = ConversationService()
    conversation = await conversation_service.update_conversation(
        session=session,
        conversation_id=conversation_id,
        user_id=user_id,
        title=conversation_request.title,
    )
    return ConversationResponse(
        id=conversation.id,
        user_id=conversation.user_id,
        title=conversation.title,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        messages=None,
    )


@router.delete(
    "/conversations/{conversation_id}",
    summary="Delete conversation",
    description="Delete a conversation and all its messages.",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_conversation(
    request: Request,
    conversation_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> None:
    """
    Delete a conversation and all its messages.

    Args:
        request: FastAPI request object
        conversation_id: Conversation ID
        session: Database session
    """
    user_id = request.state.user_id
    conversation_service = ConversationService()
    await conversation_service.delete_conversation(
        session=session, conversation_id=conversation_id, user_id=user_id
    )


@router.delete(
    "/messages/{message_id}",
    summary="Delete message",
    description="Delete a message from a conversation.",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_message(
    request: Request,
    message_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> None:
    """
    Delete a message from a conversation.

    Args:
        request: FastAPI request object
        message_id: Message ID
        session: Database session
    """
    user_id = request.state.user_id
    conversation_service = ConversationService()
    await conversation_service.delete_message(
        session=session, message_id=message_id, user_id=user_id
    )


@router.get(
    "/models",
    summary="List available models",
    description="Get list of available Ollama models.",
    response_model=ModelsListResponse,
)
async def list_models() -> ModelsListResponse:
    """
    List available models from Ollama.

    Returns:
        ModelsListResponse containing list of available models
    """
    chat_service = ChatService()
    return await chat_service.list_models()
