"""Chat API routes."""

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
    UpdateConversationRequest,
)
from services.chat_service import ChatService
from services.conversation_service import ConversationService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])


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
    logger.info(f"Chat request from user {user_id}")

    # Validate messages
    if not chat_request.messages:
        raise AppException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Messages are required",
        )

    # Convert messages to dict format
    messages = [{"role": msg.role, "content": msg.content} for msg in chat_request.messages]

    # Add system prompt if provided
    if chat_request.system_prompt:
        messages.insert(0, {"role": "system", "content": chat_request.system_prompt})

    # Create services
    chat_service = ChatService()
    conversation_service = ConversationService()

    # Save user messages if conversation_id is provided
    if chat_request.conversation_id:
        try:
            # Save user messages to conversation
            for msg in chat_request.messages:
                if msg.role == "user":
                    await conversation_service.add_message(
                        session=session,
                        conversation_id=chat_request.conversation_id,
                        user_id=user_id,
                        message_data={
                            "role": msg.role,
                            "content": msg.content,
                            "model": None,
                        },
                    )
        except AppException:
            # If conversation not found, continue without saving
            logger.warning(
                f"Conversation {chat_request.conversation_id} not found, continuing without saving"
            )

    model_name = chat_request.model or "qwen3:8b"

    async def generate() -> None:
        """Generator function for streaming responses in AI SDK-compatible format."""
        # Track assistant response for saving
        assistant_content = ""
        chunk_id = 0
        # Errors are handled within stream_chat and yielded as SSE events
        # No need to catch and re-raise exceptions here
        async for chunk in chat_service.stream_chat(messages=messages, model=chat_request.model):
            # Only process SSE data lines - skip empty lines and non-SSE formatted lines
            if not chunk.startswith("data: "):
                # Skip non-SSE formatted lines to avoid breaking AI SDK parser
                continue

            try:
                # Extract JSON part: remove "data: " prefix and strip trailing newlines/whitespace
                json_str = chunk[6:].strip()
                if not json_str:
                    # Skip empty data lines
                    continue

                data = json.loads(json_str)
                content = data.get("content", "")
                thinking = data.get("thinking")
                done = data.get("done", False)

                # Process thinking tokens if present (for models that support reasoning)
                # Send thinking as SSE comment lines (starting with :) which AI SDK ignores
                # but we can parse manually in the frontend
                if thinking:
                    try:
                        thinking_data = {
                            "thinking": thinking,
                            "messageId": f"chatcmpl-{chunk_id}",
                        }
                        # SSE comments (starting with :) are ignored by parsers but can be read manually
                        # Ensure proper JSON encoding
                        yield f":thinking {json.dumps(thinking_data, ensure_ascii=False)}\n"
                    except (TypeError, ValueError) as e:
                        # Skip invalid thinking data
                        logger.warning(f"Failed to encode thinking data: {e!s}")

                # Process content if present (including error messages)
                # Only send content chunks if content is non-empty
                if content and content.strip():
                    assistant_content += content
                    # Format for AI SDK: OpenAI-compatible format
                    try:
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
                        chunk_id += 1
                        yield f"data: {json.dumps(ai_sdk_chunk, ensure_ascii=False)}\n\n"
                    except (TypeError, ValueError) as e:
                        # Skip invalid chunks
                        logger.warning(f"Failed to encode chunk: {e!s}")
                        continue

                # If done, save assistant message and signal completion
                if done:
                    # Save assistant message if conversation_id provided and we have content
                    if chat_request.conversation_id and assistant_content:
                        try:
                            await conversation_service.add_message(
                                session=session,
                                conversation_id=chat_request.conversation_id,
                                user_id=user_id,
                                message_data={
                                    "role": "assistant",
                                    "content": assistant_content,
                                    "model": model_name,
                                },
                            )
                        except AppException:
                            # Log but don't fail the stream
                            logger.warning("Failed to save assistant message to conversation")
                    # Always signal completion to AI SDK when done
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
                    yield f"data: {json.dumps(final_chunk)}\n\n"
                    yield "data: [DONE]\n\n"
                    break
            except json.JSONDecodeError as e:
                # Log JSON parse errors but continue streaming
                logger.warning(f"Failed to parse SSE chunk JSON: {e!s}, chunk: {chunk[:100]}")
                continue
            except Exception as e:
                # Log other errors but continue streaming
                logger.warning(f"Error processing SSE chunk: {e!s}, chunk: {chunk[:100]}")
                continue

    return StreamingResponse(
        generate(),
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
