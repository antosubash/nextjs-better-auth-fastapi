"""Chat API routes."""

import logging

from fastapi import APIRouter, Request, status
from fastapi.responses import StreamingResponse

from core.constants import ErrorMessages
from core.exceptions import AppException
from schemas.chat import ChatRequest
from services.chat_service import ChatService

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
) -> StreamingResponse:
    """
    Stream chat responses from Ollama.

    Args:
        chat_request: Chat request with messages and model
        request: FastAPI request object

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

    # Create chat service and stream response
    chat_service = ChatService()

    async def generate():
        """Generator function for streaming responses."""
        # Errors are handled within stream_chat and yielded as SSE events
        # No need to catch and re-raise exceptions here
        async for chunk in chat_service.stream_chat(messages=messages, model=chat_request.model):
            yield chunk

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
