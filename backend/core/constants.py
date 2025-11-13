"""Constants for error messages and other hardcoded strings."""


# Permission resources - must stay in sync with nextjs/lib/constants.ts
class PermissionResources:
    """Permission resource constants."""

    PROJECT = "project"
    ORGANIZATION = "organization"
    USER = "user"
    API_KEY = "apiKey"
    ROLE = "role"
    MEMBER = "member"
    INVITATION = "invitation"
    FILE = "file"
    SETTINGS = "settings"
    SESSION = "session"


# Permission actions - must stay in sync with nextjs/lib/constants.ts
class PermissionActions:
    """Permission action constants."""

    READ = "read"
    LIST = "list"
    VIEW = "view"
    CREATE = "create"
    SHARE = "share"
    UPDATE = "update"
    DELETE = "delete"
    BAN = "ban"
    UNBAN = "unban"
    SET_ROLE = "set-role"
    SET_PASSWORD = "set-password"
    IMPERSONATE = "impersonate"
    GET = "get"
    INVITE = "invite"
    REMOVE = "remove"
    REVOKE = "revoke"
    UPLOAD = "upload"
    DOWNLOAD = "download"
    CANCEL = "cancel"


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
    USER_ID_NOT_FOUND = "User ID not found in token"

    # API key errors
    API_KEY_MISSING = "API key missing"
    API_KEY_INVALID = "Invalid API key"
    API_KEY_VERIFICATION_FAILED = "API key verification failed"
    API_KEY_VERIFICATION_ERROR = "API key verification error"
    API_KEY_INSUFFICIENT_PERMISSIONS = "API key has insufficient permissions"

    # JWKS errors
    JWKS_FETCH_FAILED = "Failed to fetch JWKS"
    JWKS_KEY_NOT_FOUND = "Key with kid '{kid}' not found in JWKS"

    # File operation errors
    FILE_WRITE_ERROR = "Failed to write to file"
    FILE_READ_ERROR = "Failed to read from file"

    # Task errors
    TASK_NOT_FOUND = "Task not found"
    TASK_CREATE_ERROR = "Failed to create task"
    TASK_UPDATE_ERROR = "Failed to update task"
    TASK_DELETE_ERROR = "Failed to delete task"
    TASK_ACCESS_DENIED = "Access denied to this task"

    # Job errors
    JOB_NOT_FOUND = "Job not found"
    JOB_CREATE_ERROR = "Failed to create job"
    JOB_UPDATE_ERROR = "Failed to update job"
    JOB_DELETE_ERROR = "Failed to delete job"
    JOB_FUNCTION_NOT_FOUND = "Job function not found"
    JOB_INVALID_SCHEDULE = "Invalid job schedule"
    JOB_ALREADY_EXISTS = "Job with this ID already exists"

    # General errors
    INTERNAL_SERVER_ERROR = "Internal server error"
    SERVICE_UNAVAILABLE = "Service unavailable"


# Success messages
class SuccessMessages:
    """Success message constants."""

    DATA_WRITTEN = "Data written successfully"
    HEALTH_CHECK_OK = "Service is healthy"
    TASK_CREATED = "Task created successfully"
    TASK_UPDATED = "Task updated successfully"
    TASK_DELETED = "Task deleted successfully"
    JOB_CREATED = "Job created successfully"
    JOB_UPDATED = "Job updated successfully"
    JOB_DELETED = "Job deleted successfully"
    JOB_PAUSED = "Job paused successfully"
    JOB_RESUMED = "Job resumed successfully"


# API response messages
class ApiMessages:
    """API response message constants."""

    HELLO_WORLD = "Hello World! FastAPI is working."
