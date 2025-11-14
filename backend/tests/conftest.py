"""Pytest configuration and fixtures."""

import asyncio
import contextlib

import pytest
from fastapi.testclient import TestClient

from core.app import create_app
from dependencies import close_http_client


@pytest.fixture(scope="function")
def app():
    """Create FastAPI app instance for testing."""
    app = create_app()
    yield app
    # Cleanup
    with contextlib.suppress(Exception):
        asyncio.run(close_http_client())


@pytest.fixture(scope="function")
def client(app):
    """Create test client."""
    return TestClient(app)


@pytest.fixture
def mock_token():
    """Mock JWT token for testing."""
    return "mock.jwt.token"


@pytest.fixture
def mock_token_payload():
    """Mock token payload."""
    return {
        "sub": "user123",
        "id": "user123",
        "iss": "http://localhost:3000",
        "aud": "http://localhost:3000",
    }
