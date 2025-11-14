"""Tests for authentication module."""

from unittest.mock import AsyncMock, patch

import pytest

from core.auth import get_jwks, verify_token_string
from core.exceptions import AuthenticationError, JWKSError


@pytest.mark.asyncio
async def test_get_jwks_success(mock_token):
    """Test successful JWKS fetch."""
    mock_jwks = {"keys": [{"kid": "test-kid", "kty": "OKP", "crv": "Ed25519", "x": "test-key"}]}

    with patch("core.auth.httpx.AsyncClient") as mock_client:
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_jwks
        mock_response.raise_for_status = AsyncMock()

        mock_client_instance = AsyncMock()
        mock_client_instance.get.return_value = mock_response
        mock_client_instance.__aenter__.return_value = mock_client_instance
        mock_client.return_value = mock_client_instance

        result = await get_jwks(force_refresh=True)
        assert result == mock_jwks


@pytest.mark.asyncio
async def test_get_jwks_failure():
    """Test JWKS fetch failure."""
    with patch("core.auth.httpx.AsyncClient") as mock_client:
        mock_client_instance = AsyncMock()
        mock_client_instance.get.side_effect = Exception("Network error")
        mock_client_instance.__aenter__.return_value = mock_client_instance
        mock_client.return_value = mock_client_instance

        with pytest.raises(JWKSError):
            await get_jwks(force_refresh=True)


@pytest.mark.asyncio
async def test_verify_token_string_missing_kid():
    """Test token verification with missing kid."""
    invalid_token = "invalid.token.here"

    with patch("core.auth.jwt.get_unverified_header") as mock_header:
        mock_header.return_value = {"alg": "EdDSA"}

        with pytest.raises(AuthenticationError):
            await verify_token_string(invalid_token)
