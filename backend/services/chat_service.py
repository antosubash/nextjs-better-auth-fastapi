"""Chat service for LLM interactions using Ollama."""

from collections.abc import AsyncGenerator
import logging

from ollama import AsyncClient, ResponseError

from core.config import OLLAMA_BASE_URL, OLLAMA_DEFAULT_MODEL
from core.constants import ErrorMessages
from core.exceptions import OllamaError
from schemas.chat import ChatResponse, ModelInfo, ModelsListResponse

logger = logging.getLogger(__name__)


class ChatService:
    """Service for chat operations with Ollama."""

    def __init__(self) -> None:
        """Initialize chat service with Ollama client."""
        self.client = AsyncClient(host=OLLAMA_BASE_URL)

    async def stream_chat(
        self, messages: list[dict[str, str]], model: str | None = None
    ) -> AsyncGenerator[str, None]:
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
        model_name = (model.strip() if model and model.strip() else None) or OLLAMA_DEFAULT_MODEL
        logger.info(f"Streaming chat with model: {model_name}")

        ollama_messages = [{"role": msg["role"], "content": msg["content"]} for msg in messages]

        try:
            chat_result = self.client.chat(model=model_name, messages=ollama_messages, stream=True)
            stream = chat_result if hasattr(chat_result, "__aiter__") else await chat_result

            async for chunk in stream:
                thinking = (
                    chunk.get("thinking", {}).get("content") if chunk.get("thinking") else None
                )
                content = (
                    chunk.get("message", {}).get("content", "") if chunk.get("message") else ""
                )
                done = chunk.get("done", False)
                response_model = chunk.get("model", model_name)

                if content or thinking:
                    response = ChatResponse(
                        content=content,
                        model=response_model,
                        done=done,
                        thinking=thinking,
                    )
                    yield f"data: {response.model_dump_json()}\n\n"

                if done:
                    break

        except (ResponseError, ConnectionError, Exception) as e:
            error_message = (
                str(e)
                if isinstance(e, ResponseError) and str(e)
                else ErrorMessages.OLLAMA_MODEL_ERROR
                if isinstance(e, ResponseError)
                else ErrorMessages.OLLAMA_CONNECTION_ERROR
                if isinstance(e, ConnectionError)
                else ErrorMessages.CHAT_STREAM_ERROR
            )

            logger.error(
                f"Ollama API error: {e!s}"
                if isinstance(e, ResponseError)
                else f"Failed to connect to Ollama: {e!s}"
                if isinstance(e, ConnectionError)
                else f"Chat streaming error: {e!s}",
                exc_info=True,
            )

            error_response = ChatResponse(
                content=f"Error: {error_message}",
                model=model_name,
                done=True,
            )
            yield f"data: {error_response.model_dump_json()}\n\n"

    async def list_models(self) -> ModelsListResponse:
        """
        List available models from Ollama.

        Returns:
            ModelsListResponse containing list of available models

        Raises:
            Exception: If unable to connect to Ollama or fetch models
        """
        try:
            logger.info("Fetching available models from Ollama")
            response = await self.client.list()
            models = []
            for model in response.get("models", []):
                # Handle both dict and object responses from Ollama client
                model_dict = model.model_dump() if hasattr(model, "model_dump") else model

                # The Ollama client uses 'model' field, not 'name'
                name = model_dict.get("model", "")

                models.append(
                    ModelInfo(
                        name=name,
                        size=model_dict.get("size", 0),
                        digest=model_dict.get("digest", ""),
                        details=model_dict.get("details", {}),
                        modified_at=str(model_dict.get("modified_at", "")),
                    )
                )
            return ModelsListResponse(models=models)
        except Exception as e:
            logger.error("Failed to list models from Ollama: %s", e, exc_info=True)
            error_detail = f"Failed to fetch models from Ollama: {e}"
            raise OllamaError(error_detail) from e
