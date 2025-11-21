"""Database connection and session management."""

from collections.abc import AsyncGenerator
import logging

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import Session, SQLModel, create_engine

from core.config import (
    DATABASE_URL,
    DATABASE_URL_SYNC,
    DB_MAX_OVERFLOW,
    DB_POOL_RECYCLE,
    DB_POOL_SIZE,
    DB_POOL_TIMEOUT,
    DB_SCHEMA,
)

logger = logging.getLogger(__name__)

# Async engine for application use
async_engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_size=DB_POOL_SIZE,
    max_overflow=DB_MAX_OVERFLOW,
    pool_timeout=DB_POOL_TIMEOUT,
    pool_recycle=DB_POOL_RECYCLE,
    connect_args={"server_settings": {"search_path": DB_SCHEMA}},
)

# Sync engine for Alembic migrations
sync_engine = create_engine(
    DATABASE_URL_SYNC,
    echo=False,
    pool_size=DB_POOL_SIZE,
    max_overflow=DB_MAX_OVERFLOW,
    pool_timeout=DB_POOL_TIMEOUT,
    pool_recycle=DB_POOL_RECYCLE,
    connect_args={"options": f"-csearch_path={DB_SCHEMA}"},
)

# Async session factory
AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Sync session factory for Alembic
SessionLocal = sessionmaker(
    bind=sync_engine,
    autocommit=False,
    autoflush=False,
)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency to get async database session.

    Yields:
        AsyncSession: Database session
    """
    async with AsyncSessionLocal() as session:
        try:
            # Ensure search_path is set for this session
            await session.execute(text(f'SET search_path TO "{DB_SCHEMA}"'))
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


def get_sync_session() -> Session:
    """
    Get synchronous database session for migrations.

    Returns:
        Session: Database session
    """
    return SessionLocal()


async def init_db() -> None:
    """
    Initialize database schema and tables.
    Creates the schema if it doesn't exist, then creates all tables defined in SQLModel models.
    """
    try:
        async with async_engine.begin() as conn:
            # Create schema if it doesn't exist
            await conn.execute(text(f'CREATE SCHEMA IF NOT EXISTS "{DB_SCHEMA}"'))
            # Set search_path for this connection
            await conn.execute(text(f'SET search_path TO "{DB_SCHEMA}"'))
            # Import all models to ensure they're registered
            from models import chat, job_history, task  # noqa: F401, PLC0415

            # Create all tables
            await conn.run_sync(SQLModel.metadata.create_all)
        logger.info(f"Database schema '{DB_SCHEMA}' and tables initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e!s}", exc_info=True)
        raise


async def close_db() -> None:
    """
    Close database connections.
    """
    try:
        await async_engine.dispose()
        logger.info("Database connections closed")
    except Exception as e:
        logger.error(f"Error closing database connections: {e!s}", exc_info=True)
