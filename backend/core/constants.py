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


# Job trigger types
class JobTriggerTypes:
    """Job trigger type constants."""

    CRON = "cron"
    INTERVAL = "interval"
    ONCE = "once"


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

    # Storage errors
    STORAGE_UPLOAD_ERROR = "Failed to upload file"
    STORAGE_DELETE_ERROR = "Failed to delete file"
    STORAGE_GET_ERROR = "Failed to retrieve file"
    STORAGE_FILE_TOO_LARGE = "File size exceeds maximum allowed size"
    STORAGE_INVALID_FILE_TYPE = "Invalid file type. Only image files are allowed"
    STORAGE_FILE_REQUIRED = "File is required"
    STORAGE_BUCKET_ERROR = "Failed to initialize storage bucket"

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

    # Chat errors
    CHAT_ERROR = "Chat error occurred"
    OLLAMA_CONNECTION_ERROR = "Failed to connect to Ollama service"
    OLLAMA_MODEL_ERROR = "Invalid or unavailable model"
    CHAT_STREAM_ERROR = "Error streaming chat response"
    CONVERSATION_NOT_FOUND = "Conversation not found"
    CONVERSATION_CREATE_ERROR = "Failed to create conversation"
    CONVERSATION_UPDATE_ERROR = "Failed to update conversation"
    CONVERSATION_DELETE_ERROR = "Failed to delete conversation"
    CONVERSATION_ACCESS_DENIED = "Access denied to this conversation"
    MESSAGE_NOT_FOUND = "Message not found"
    MESSAGE_DELETE_ERROR = "Failed to delete message"
    MESSAGE_ACCESS_DENIED = "Access denied to this message"


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
    PROFILE_PICTURE_UPLOADED = "Profile picture uploaded successfully"
    PROFILE_PICTURE_DELETED = "Profile picture deleted successfully"
    CONVERSATION_CREATED = "Conversation created successfully"
    CONVERSATION_UPDATED = "Conversation updated successfully"
    CONVERSATION_DELETED = "Conversation deleted successfully"
    MESSAGE_DELETED = "Message deleted successfully"


# API response messages
class ApiMessages:
    """API response message constants."""

    HELLO_WORLD = "Hello World! FastAPI is working."


# Validation error messages
class ValidationErrorMessages:
    """Validation error message constants."""

    # Field required errors
    FIELD_REQUIRED = "This field is required"
    CONTENT_REQUIRED = "Content is required"
    TITLE_REQUIRED = "Title is required"
    JOB_ID_REQUIRED = "Job ID is required"
    FUNCTION_REQUIRED = "Function is required"
    CRON_EXPRESSION_REQUIRED = "Cron expression is required"

    # Field empty errors
    CONTENT_CANNOT_BE_EMPTY = "Content cannot be empty"
    TITLE_CANNOT_BE_EMPTY = "Title cannot be empty"
    JOB_ID_CANNOT_BE_EMPTY = "Job ID cannot be empty"

    # Field format errors
    TRIGGER_TYPE_INVALID = "Trigger type must be one of: {valid_types}"
    CRON_EXPRESSION_REQUIRED_FOR_CRON = "Cron expression is required when trigger_type is 'cron'"

    # Field length errors
    FIELD_TOO_SHORT = "Field is too short (minimum {min_length} characters)"
    FIELD_TOO_LONG = "Field is too long (maximum {max_length} characters)"

    # Field value errors
    INVALID_VALUE = "Invalid value provided"
    INVALID_FORMAT = "Invalid format"

    # Sanitization errors
    VALUE_MUST_BE_STRING = "Value must be a string"
    STRING_TOO_SHORT = "String must be at least {min_length} characters long"
    STRING_TOO_LONG = "String must be at most {max_length} characters long"
    FILENAME_MUST_BE_STRING = "Filename must be a string"
    FILENAME_CANNOT_BE_EMPTY = "Filename cannot be empty after sanitization"
    URL_MUST_BE_STRING = "URL must be a string"
    URL_CANNOT_BE_EMPTY = "URL cannot be empty"
    URL_INVALID_FORMAT = "Invalid URL format: {error}"
    URL_MISSING_SCHEME = "URL must include a scheme (e.g., http:// or https://)"
    URL_INVALID_SCHEME = "URL scheme must be one of: {schemes}"
    HTML_MUST_BE_STRING = "HTML must be a string"
