"""Constants for error messages and other hardcoded strings."""

# Error messages
class ErrorMessages:
    """Error message constants."""
    
    # Authentication errors
    AUTH_HEADER_MISSING = "Authorization header missing"
    AUTH_INVALID_SCHEME = "Invalid authorization scheme. Expected 'Bearer'"
    AUTH_TOKEN_MISSING = "Token missing"
    AUTH_TOKEN_MISSING_KID = "Token missing key ID (kid)"
    AUTH_TOKEN_INVALID = "Invalid authentication token"
    AUTH_TOKEN_VERIFICATION_FAILED = "Token verification failed"
    AUTH_TOKEN_VERIFICATION_ERROR = "Token verification error"
    
    # JWKS errors
    JWKS_FETCH_FAILED = "Failed to fetch JWKS"
    JWKS_KEY_NOT_FOUND = "Key with kid '{kid}' not found in JWKS"
    
    # File operation errors
    FILE_WRITE_ERROR = "Failed to write to file"
    FILE_READ_ERROR = "Failed to read from file"
    
    # General errors
    INTERNAL_SERVER_ERROR = "Internal server error"
    SERVICE_UNAVAILABLE = "Service unavailable"


# Success messages
class SuccessMessages:
    """Success message constants."""
    
    DATA_WRITTEN = "Data written successfully"
    HEALTH_CHECK_OK = "Service is healthy"


# API response messages
class ApiMessages:
    """API response message constants."""
    
    HELLO_WORLD = "Hello World! FastAPI is working."

