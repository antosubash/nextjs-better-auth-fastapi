"""Job API routes."""

import logging

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_session
from schemas.job import (
    JobCreate,
    JobHistoryListResponse,
    JobListResponse,
    JobResponse,
)
from services.job_service import JobService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/jobs", tags=["jobs"])


def get_job_service() -> JobService:
    """
    Dependency to get job service instance.

    Returns:
        JobService instance
    """
    return JobService()


@router.post(
    "/",
    response_model=JobResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create job",
    description="Create a new background job (scheduled, interval, or one-time).",
)
async def create_job(
    job_data: JobCreate,
    request: Request,
    session: AsyncSession = Depends(get_session),
    job_service: JobService = Depends(get_job_service),
) -> JobResponse:
    """
    Create a new job.

    Args:
        job_data: Job creation data
        request: FastAPI request object
        session: Database session
        job_service: Job service dependency

    Returns:
        Created job
    """
    user_id = getattr(request.state, "user_id", None)
    job = await job_service.create_job(job_data, session, user_id=user_id)
    logger.info(f"Job created: {job.id} by user {user_id}")
    return job


# Register route without trailing slash to handle /jobs (not just /jobs/)
router.add_api_route(
    "",
    create_job,
    methods=["POST"],
    response_model=JobResponse,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,
)


@router.get(
    "/",
    response_model=JobListResponse,
    summary="List jobs",
    description="List all background jobs with pagination.",
)
async def list_jobs(
    _request: Request,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    job_service: JobService = Depends(get_job_service),
) -> JobListResponse:
    """
    List jobs with pagination.

    Args:
        _request: FastAPI request object (unused, kept for consistency)
        page: Page number
        page_size: Items per page
        job_service: Job service dependency

    Returns:
        Paginated job list
    """
    jobs, total = job_service.list_all_jobs(page=page, page_size=page_size)

    total_pages = (total + page_size - 1) // page_size if total > 0 else 0

    return JobListResponse(
        items=jobs,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


# Register route without trailing slash to handle /jobs (not just /jobs/)
router.add_api_route(
    "",
    list_jobs,
    methods=["GET"],
    response_model=JobListResponse,
    include_in_schema=False,
)


@router.get(
    "/history",
    response_model=JobHistoryListResponse,
    summary="List job history",
    description="List job history records with pagination.",
)
async def list_job_history(
    _request: Request,
    job_id: str | None = Query(None, description="Filter by job ID"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    session: AsyncSession = Depends(get_session),
    job_service: JobService = Depends(get_job_service),
) -> JobHistoryListResponse:
    """
    List job history with pagination.

    Args:
        _request: FastAPI request object (unused, kept for consistency)
        job_id: Optional job ID to filter by
        page: Page number
        page_size: Items per page
        session: Database session
        job_service: Job service dependency

    Returns:
        Paginated job history list
    """
    history, total = await job_service.list_job_history(
        session=session, job_id=job_id, page=page, page_size=page_size
    )

    total_pages = (total + page_size - 1) // page_size if total > 0 else 0

    return JobHistoryListResponse(
        items=history,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get(
    "/{job_id}",
    response_model=JobResponse,
    summary="Get job",
    description="Get a specific job by ID.",
)
async def get_job(
    job_id: str,
    _request: Request,
    job_service: JobService = Depends(get_job_service),
) -> JobResponse:
    """
    Get a job by ID.

    Args:
        job_id: Job ID
        _request: FastAPI request object (unused, kept for consistency)
        job_service: Job service dependency

    Returns:
        Job data
    """
    return job_service.get_job_by_id(job_id)


@router.delete(
    "/{job_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete job",
    description="Delete a job.",
)
async def delete_job(
    job_id: str,
    request: Request,
    session: AsyncSession = Depends(get_session),
    job_service: JobService = Depends(get_job_service),
) -> None:
    """
    Delete a job.

    Args:
        job_id: Job ID
        request: FastAPI request object
        session: Database session
        job_service: Job service dependency
    """
    user_id = getattr(request.state, "user_id", None)
    await job_service.delete_job(job_id, session, user_id=user_id)
    logger.info(f"Job deleted: {job_id} by user {user_id}")


@router.post(
    "/{job_id}/pause",
    response_model=JobResponse,
    summary="Pause job",
    description="Pause a running job.",
)
async def pause_job(
    job_id: str,
    request: Request,
    session: AsyncSession = Depends(get_session),
    job_service: JobService = Depends(get_job_service),
) -> JobResponse:
    """
    Pause a job.

    Args:
        job_id: Job ID
        request: FastAPI request object
        session: Database session
        job_service: Job service dependency

    Returns:
        Updated job data
    """
    user_id = getattr(request.state, "user_id", None)
    await job_service.pause_job_by_id(job_id, session, user_id=user_id)
    logger.info(f"Job paused: {job_id} by user {user_id}")
    return job_service.get_job_by_id(job_id)


@router.post(
    "/{job_id}/resume",
    response_model=JobResponse,
    summary="Resume job",
    description="Resume a paused job.",
)
async def resume_job(
    job_id: str,
    request: Request,
    session: AsyncSession = Depends(get_session),
    job_service: JobService = Depends(get_job_service),
) -> JobResponse:
    """
    Resume a paused job.

    Args:
        job_id: Job ID
        request: FastAPI request object
        session: Database session
        job_service: Job service dependency

    Returns:
        Updated job data
    """
    user_id = getattr(request.state, "user_id", None)
    await job_service.resume_job_by_id(job_id, session, user_id=user_id)
    logger.info(f"Job resumed: {job_id} by user {user_id}")
    return job_service.get_job_by_id(job_id)
