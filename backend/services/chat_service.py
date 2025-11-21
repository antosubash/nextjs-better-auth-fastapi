"""Chat service for LLM interactions using Ollama."""

import logging

from ollama import AsyncClient, ResponseError

from core.config import OLLAMA_BASE_URL, OLLAMA_DEFAULT_MODEL
from core.constants import ErrorMessages
from schemas.chat import ChatResponse

logger = logging.getLogger(__name__)


class ChatService:
    """Service for chat operations with Ollama."""

    def __init__(self) -> None:
        """Initialize chat service with Ollama client."""
        self.client = AsyncClient(host=OLLAMA_BASE_URL)

    async def stream_chat(self, messages: list[dict[str, str]], model: str | None = None):
        """
        Stream chat response from Ollama.

        Args:
            messages: List of chat messages with role and content
            model: Model name (optional, uses default if not provided)

        Yields:
            JSON strings with chat response chunks

        Note:
            Errors are yielded as SSE events instead of raising exceptions
            to avoid "response already started" errors during streaming.
        """
        # Sanitize model name: strip whitespace and use default if empty
        if model:
            model_name = model.strip()
            if not model_name:
                model_name = OLLAMA_DEFAULT_MODEL
        else:
            model_name = OLLAMA_DEFAULT_MODEL

        logger.info(f"Streaming chat with model: {model_name}")

        # Convert messages to Ollama format
        ollama_messages = [{"role": msg["role"], "content": msg["content"]} for msg in messages]

        try:
            # Stream response from Ollama
            # The chat() method with stream=True should return an async iterator
            # Handle case where it might return a coroutine that needs to be awaited
            chat_result = self.client.chat(model=model_name, messages=ollama_messages, stream=True)

            # Check if it has __aiter__ method (is async iterable)
            # If not, it might be a coroutine that needs to be awaited
            if hasattr(chat_result, "__aiter__"):
                stream = chat_result
            else:
                # It's likely a coroutine, await it first
                stream = await chat_result

            async for chunk in stream:
                if chunk.get("message"):
                    content = chunk["message"].get("content", "")
                    done = chunk.get("done", False)
                    response_model = chunk.get("model", model_name)

                    response = ChatResponse(
                        content=content,
                        model=response_model,
                        done=done,
                    )

                    # Format as SSE (Server-Sent Events)
                    yield f"data: {response.model_dump_json()}\n\n"

                    if done:
                        break

        except ResponseError as e:
            # Handle Ollama API errors (e.g., invalid model, model not found)
            logger.error(f"Ollama API error: {e!s} (status: {e.status_code})", exc_info=True)
            error_message = str(e) if str(e) else ErrorMessages.OLLAMA_MODEL_ERROR
            error_response = ChatResponse(
                content=f"Error: {error_message}",
                model=model_name,
                done=True,
            )
            yield f"data: {error_response.model_dump_json()}\n\n"
        except ConnectionError as e:
            logger.error(f"Failed to connect to Ollama: {e!s}", exc_info=True)
            # Yield error as SSE event instead of raising exception
            error_response = ChatResponse(
                content=f"Error: {ErrorMessages.OLLAMA_CONNECTION_ERROR}",
                model=model_name,
                done=True,
            )
            yield f"data: {error_response.model_dump_json()}\n\n"
        except Exception as e:
            logger.error(f"Chat streaming error: {e!s}", exc_info=True)
            # Yield error as SSE event instead of raising exception
            error_response = ChatResponse(
                content=f"Error: {ErrorMessages.CHAT_STREAM_ERROR}",
                model=model_name,
                done=True,
            )
            yield f"data: {error_response.model_dump_json()}\n\n"
