"""FastAPI dependencies for dependency injection."""

import httpx
from typing import Annotated
from fastapi import Depends
from core.config import HTTP_CLIENT_TIMEOUT


# Shared HTTP client instance
_http_client: httpx.AsyncClient | None = None


async def get_http_client() -> httpx.AsyncClient:
    """
    Get or create shared HTTP client instance.
    
    Returns:
        Shared httpx.AsyncClient instance
    """
    global _http_client
    
    if _http_client is None:
        _http_client = httpx.AsyncClient(timeout=HTTP_CLIENT_TIMEOUT)
    
    return _http_client


async def close_http_client() -> None:
    """Close the shared HTTP client."""
    global _http_client
    
    if _http_client is not None:
        await _http_client.aclose()
        _http_client = None


# Type alias for dependency injection
HttpClient = Annotated[httpx.AsyncClient, Depends(get_http_client)]

