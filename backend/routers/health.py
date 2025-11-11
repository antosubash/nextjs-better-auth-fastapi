"""Health check routes."""

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
import httpx
import logging
from typing import Dict, Any
from core.config import BETTER_AUTH_URL, JWKS_URL
from core.constants import SuccessMessages
from dependencies import get_http_client

logger = logging.getLogger(__name__)

router = APIRouter(tags=["health"])


@router.get(
    "/health",
    summary="Health check",
    description="Check the health status of the API and its dependencies.",
    responses={
        200: {
            "description": "Service is healthy",
            "content": {
                "application/json": {
                    "example": {
                        "status": "healthy",
                        "dependencies": {
                            "better_auth": "ok",
                            "jwks": "ok"
                        }
                    }
                }
            }
        },
        503: {
            "description": "Service is unhealthy",
            "content": {
                "application/json": {
                    "example": {
                        "status": "unhealthy",
                        "dependencies": {
                            "better_auth": "error",
                            "jwks": "ok"
                        }
                    }
                }
            }
        }
    }
)
async def health_check(request: Request) -> JSONResponse:
    """
    Check health status of the service and its dependencies.
    
    Args:
        request: FastAPI request object
        
    Returns:
        JSONResponse with health status
    """
    request_id = getattr(request.state, "request_id", None)
    dependencies: Dict[str, str] = {}
    overall_status = "healthy"
    
    # Check Better Auth connectivity
    try:
        http_client = await get_http_client()
        response = await http_client.get(f"{BETTER_AUTH_URL}/api/auth/jwks", timeout=2.0)
        if response.status_code == 200:
            dependencies["better_auth"] = "ok"
            dependencies["jwks"] = "ok"
        else:
            dependencies["better_auth"] = f"error: {response.status_code}"
            dependencies["jwks"] = "error"
            overall_status = "unhealthy"
    except Exception as e:
        logger.warning(
            f"Health check failed for Better Auth: {str(e)}",
            extra={"request_id": request_id}
        )
        dependencies["better_auth"] = f"error: {str(e)}"
        dependencies["jwks"] = "error"
        overall_status = "unhealthy"
    
    status_code = 200 if overall_status == "healthy" else 503
    
    return JSONResponse(
        status_code=status_code,
        content={
            "status": overall_status,
            "message": SuccessMessages.HEALTH_CHECK_OK if overall_status == "healthy" else "Service dependencies unavailable",
            "dependencies": dependencies
        }
    )

