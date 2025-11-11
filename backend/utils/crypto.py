"""Cryptographic utility functions."""

import base64


def base64url_decode(data: str) -> bytes:
    """
    Decode base64url string to bytes.
    
    Args:
        data: Base64url encoded string
        
    Returns:
        Decoded bytes
    """
    # Add padding if needed
    padding = 4 - len(data) % 4
    if padding != 4:
        data += "=" * padding
    # Replace URL-safe characters
    data = data.replace("-", "+").replace("_", "/")
    return base64.b64decode(data)

