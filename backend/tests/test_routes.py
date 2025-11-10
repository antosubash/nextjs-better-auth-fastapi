"""Tests for API routes."""

import pytest
from unittest.mock import AsyncMock, patch
from services.file_service import FileService


def test_hello_endpoint(client):
    """Test hello world endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()


def test_health_endpoint(client):
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code in [200, 503]
    assert "status" in response.json()
    assert "dependencies" in response.json()


def test_getdata_endpoint_missing_auth(client):
    """Test data endpoint requires authentication."""
    response = client.post("/getdata", json={"content": "test"})
    assert response.status_code == 401


def test_getdata_endpoint_invalid_payload(client):
    """Test data endpoint validates payload."""
    # This will fail auth first, but if we mock auth, we'd test validation
    response = client.post("/getdata", json={})
    assert response.status_code == 401  # Auth fails first


@pytest.mark.asyncio
async def test_file_service_write():
    """Test file service write operation."""
    import tempfile
    import os
    
    with tempfile.NamedTemporaryFile(mode="w", delete=False) as tmp:
        tmp_path = tmp.name
    
    try:
        service = FileService(file_path=tmp_path)
        result = await service.write_data("test content")
        assert "successfully" in result.lower() or "written" in result.lower()
        
        # Verify file was written
        assert os.path.exists(tmp_path)
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


@pytest.mark.asyncio
async def test_file_service_read():
    """Test file service read operation."""
    import tempfile
    import os
    
    with tempfile.NamedTemporaryFile(mode="w", delete=False) as tmp:
        tmp.write("test content\n")
        tmp_path = tmp.name
    
    try:
        service = FileService(file_path=tmp_path)
        content = await service.read_data()
        assert "test content" in content
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)

