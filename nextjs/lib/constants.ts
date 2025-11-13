export const AUTH_LABELS = {
  EMAIL: "Email",
  PASSWORD: "Password",
  NAME: "Name",
  LOGIN: "Log in",
  SIGNUP: "Sign up",
  LOGOUT: "Log out",
  ALREADY_HAVE_ACCOUNT: "Already have an account?",
  DONT_HAVE_ACCOUNT: "Don't have an account?",
  WELCOME: "Welcome",
  LOGGED_IN_AS: "Logged in as",
} as const;

export const PROFILE = {
  WELCOME_BACK: "Welcome back!",
  ACCOUNT_INFO: "Account Information",
  EMAIL_LABEL: "Email address",
  NAME_LABEL: "Full name",
  LOGOUT_CONFIRM: "Are you sure you want to log out?",
} as const;

export const AUTH_PLACEHOLDERS = {
  EMAIL: "Enter your email",
  PASSWORD: "Enter your password",
  NAME: "Enter your name",
} as const;

export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: "Invalid email or password",
  EMAIL_REQUIRED: "Email is required",
  PASSWORD_REQUIRED: "Password is required",
  NAME_REQUIRED: "Name is required",
  SIGNUP_FAILED: "Failed to create account",
  LOGIN_FAILED: "Failed to log in",
} as const;

export const STORAGE_KEYS = {
  SESSION_TOKEN: "better-auth.session_token",
} as const;

export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
} as const;

export const BETTER_AUTH_CONFIG = {
  BASE_URL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
} as const;

export const JWT_CONFIG = {
  ALGORITHM: "HS256",
} as const;

export const API_DATA = {
  TITLE: "API Data",
  SEND_DATA: "Send Data",
  CONTENT_PLACEHOLDER: "Enter content to send",
  LOADING: "Loading...",
  ERROR: "Error",
  SUCCESS: "Success",
  NO_DATA: "No data to display",
  SEND_BUTTON: "Send",
  RESPONSE_LABEL: "Response:",
} as const;

export const API_KEY_TEST = {
  TITLE: "API Key Authentication Test",
  DESCRIPTION: "Test API key authentication by making requests to protected endpoints",
  API_KEY_LABEL: "API Key",
  API_KEY_PLACEHOLDER: "Enter your API key",
  ENDPOINT_LABEL: "Endpoint",
  ENDPOINT_PLACEHOLDER: "e.g., /getdata",
  CONTENT_LABEL: "Content (JSON)",
  CONTENT_PLACEHOLDER: '{"content": "test data"}',
  METHOD_LABEL: "HTTP Method",
  SEND_REQUEST: "Send Request",
  LOADING: "Sending request...",
  SUCCESS: "Request successful",
  ERROR: "Request failed",
  RESPONSE_LABEL: "Response",
  STATUS_LABEL: "Status Code",
  HEADERS_LABEL: "Response Headers",
  USE_JWT_TOKEN: "Also include JWT token",
  AUTH_METHOD_LABEL: "Authentication Method",
  API_KEY_ONLY: "API Key Only",
  JWT_ONLY: "JWT Token Only",
  BOTH: "Both API Key and JWT",
  NO_AUTH: "No Authentication",
} as const;

export const LANDING_PAGE = {
  HERO_TITLE: "Welcome to Better Auth",
  HERO_SUBTITLE: "Secure, fast, and easy authentication for your applications",
  HERO_DESCRIPTION:
    "Get started in minutes with our powerful authentication system built on Next.js and FastAPI.",
  GET_STARTED: "Get Started",
  CREATE_ACCOUNT: "Create Account",
  SIGN_IN_DESCRIPTION: "Sign in to your account to continue",
  SIGN_UP_DESCRIPTION: "Join us today and get started",
  FEATURES_TITLE: "Why choose us?",
  FEATURES: [
    {
      TITLE: "Secure by Default",
      DESCRIPTION: "Enterprise-grade security with modern authentication protocols",
    },
    {
      TITLE: "Lightning Fast",
      DESCRIPTION: "Built for performance with optimized API responses",
    },
    {
      TITLE: "Easy Integration",
      DESCRIPTION: "Simple setup and seamless integration with your stack",
    },
  ],
} as const;

export const USER_ROLES = {
  USER: "user",
  MEMBER: "member",
  ADMIN: "admin",
  OWNER: "owner",
  MY_CUSTOM_ROLE: "myCustomRole",
  MODERATOR: "moderator",
  EDITOR: "editor",
  VIEWER: "viewer",
  SUPPORT: "support",
} as const;

export const ADMIN_LABELS = {
  TITLE: "User Management",
  CREATE_USER: "Create User",
  EDIT_USER: "Edit User",
  DELETE_USER: "Delete User",
  BAN_USER: "Ban User",
  UNBAN_USER: "Unban User",
  SET_ROLE: "Set Role",
  SEARCH_USERS: "Search users...",
  NO_USERS: "No users found",
  LOADING: "Loading users...",
  ACTIONS: "Actions",
  ROLE: "Role",
  STATUS: "Status",
  BANNED: "Banned",
  ACTIVE: "Active",
  EMAIL: "Email",
  NAME: "Name",
  PASSWORD: "Password",
  CREATED_AT: "Created At",
  BAN_REASON: "Ban Reason",
  BAN_EXPIRES: "Ban Expires",
  SAVE: "Save",
  CANCEL: "Cancel",
  CONFIRM_DELETE: "Are you sure you want to delete this user?",
  CONFIRM_BAN: "Are you sure you want to ban this user?",
  CONFIRM_UNBAN: "Are you sure you want to unban this user?",
  EMAIL_VERIFIED: "Email Verified",
  EMAIL_NOT_VERIFIED: "Email Not Verified",
  VIEW_DETAILS: "View Details",
  SELECT_ALL: "Select All",
  DESELECT_ALL: "Deselect All",
  SELECTED: "selected",
  ITEMS_PER_PAGE: "Items per page",
  SHOWING: "Showing",
  TO: "to",
  OF: "of",
  USERS: "users",
  FIRST_PAGE: "First page",
  LAST_PAGE: "Last page",
  PREVIOUS_PAGE: "Previous page",
  NEXT_PAGE: "Next page",
  PAGE: "Page",
  RESET_PASSWORD: "Reset Password",
  CHANGE_PASSWORD: "Change Password",
  NEW_PASSWORD: "New Password",
  CONFIRM_PASSWORD: "Confirm Password",
  MANAGE_SESSIONS: "Manage Sessions",
  ACTIVE_SESSIONS: "Active Sessions",
  REVOKE_SESSION: "Revoke Session",
  REVOKE_ALL_SESSIONS: "Revoke All Sessions",
  CONFIRM_REVOKE_SESSION: "Are you sure you want to revoke this session?",
  CONFIRM_REVOKE_ALL_SESSIONS: "Are you sure you want to revoke all sessions?",
  SESSION_IP: "IP Address",
  SESSION_USER_AGENT: "User Agent",
  SESSION_CREATED_AT: "Created At",
  SESSION_EXPIRES_AT: "Expires At",
  NO_SESSIONS: "No active sessions",
  IMPERSONATE_USER: "Impersonate User",
  STOP_IMPERSONATING: "Stop Impersonating",
  IMPERSONATING: "Impersonating",
  RESEND_VERIFICATION_EMAIL: "Resend Verification Email",
  MARK_EMAIL_VERIFIED: "Mark Email as Verified",
  EXPORT_USERS: "Export Users",
  EXPORT_FORMAT: "Export Format",
  EXPORT_CSV: "CSV",
  EXPORT_JSON: "JSON",
  SAVING: "Saving...",
} as const;

export const ADMIN_PLACEHOLDERS = {
  EMAIL: "Enter email",
  PASSWORD: "Enter password",
  NAME: "Enter name",
  ROLE: "Select role",
  BAN_REASON: "Enter ban reason (optional)",
  NEW_PASSWORD: "Enter new password",
  CONFIRM_PASSWORD: "Confirm new password",
} as const;

export const ADMIN_ERRORS = {
  CREATE_FAILED: "Failed to create user",
  UPDATE_FAILED: "Failed to update user",
  DELETE_FAILED: "Failed to delete user",
  BAN_FAILED: "Failed to ban user",
  UNBAN_FAILED: "Failed to unban user",
  SET_ROLE_FAILED: "Failed to set user role",
  LOAD_USERS_FAILED: "Failed to load users",
  ACCESS_DENIED: "Access denied. Admin privileges required.",
  INVALID_ROLE: "Invalid role",
  CANNOT_BAN_ADMIN: "Cannot ban admin users",
  BULK_DELETE_FAILED: "Failed to delete users",
  BULK_ROLE_SET_FAILED: "Failed to update user roles",
  BULK_BAN_FAILED: "Failed to ban users",
  BULK_UNBAN_FAILED: "Failed to unban users",
  PASSWORD_RESET_FAILED: "Failed to reset password",
  LOAD_SESSIONS_FAILED: "Failed to load sessions",
  REVOKE_SESSION_FAILED: "Failed to revoke session",
  REVOKE_SESSIONS_FAILED: "Failed to revoke sessions",
  EMAIL_VERIFICATION_FAILED: "Failed to send verification email",
  MARK_VERIFIED_FAILED: "Failed to mark email as verified",
  IMPERSONATION_FAILED: "Failed to start impersonation",
  STOP_IMPERSONATION_FAILED: "Failed to stop impersonation",
  EXPORT_FAILED: "Failed to export users",
} as const;

export const ADMIN_SUCCESS = {
  USER_CREATED: "User created successfully",
  USER_UPDATED: "User updated successfully",
  USER_DELETED: "User deleted successfully",
  USER_BANNED: "User banned successfully",
  USER_UNBANNED: "User unbanned successfully",
  ROLE_SET: "User role updated successfully",
  BULK_DELETE_SUCCESS: "Users deleted successfully",
  BULK_ROLE_SET_SUCCESS: "User roles updated successfully",
  BULK_BAN_SUCCESS: "Users banned successfully",
  BULK_UNBAN_SUCCESS: "Users unbanned successfully",
  PASSWORD_RESET: "Password reset successfully",
  SESSION_REVOKED: "Session revoked successfully",
  SESSIONS_REVOKED: "All sessions revoked successfully",
  EMAIL_VERIFICATION_SENT: "Verification email sent successfully",
  EMAIL_VERIFIED: "Email verified successfully",
  IMPERSONATION_STARTED: "Impersonation started successfully",
  IMPERSONATION_STOPPED: "Impersonation stopped successfully",
} as const;

export const DOCTOR = {
  TITLE: "Doctor / Diagnostics",
  DESCRIPTION: "Test and debug API authentication and endpoints",
  PAGE_TITLE: "API Diagnostics",
} as const;

export const DASHBOARD = {
  TITLE: "Dashboard",
  WELCOME: "Welcome to your dashboard",
  LOADING: "Loading dashboard...",
  ERROR: "Failed to load dashboard data",
  ACCOUNT_INFO: "Account Information",
  ACTIVE_SESSIONS: "Active Sessions",
  ACCOUNT_CREATED: "Account Created",
  EMAIL_VERIFIED: "Email Verified",
  EMAIL_NOT_VERIFIED: "Email Not Verified",
  RECENT_ACTIVITY: "Recent Activity",
  NO_ACTIVITY: "No recent activity",
  SESSION_CREATED: "Session created",
  VIEW_DETAILS: "View Details",
} as const;

export const ADMIN_DASHBOARD = {
  TITLE: "Admin Dashboard",
  WELCOME: "System Overview",
  LOADING: "Loading admin dashboard...",
  ERROR: "Failed to load admin dashboard data",
  TOTAL_USERS: "Total Users",
  ACTIVE_SESSIONS: "Active Sessions",
  BANNED_USERS: "Banned Users",
  RECENT_REGISTRATIONS: "Recent Registrations",
  RECENT_REGISTRATIONS_SUBTITLE: "Last 7 days",
  RECENT_USERS: "Recent Users",
  RECENT_SESSIONS: "Recent Sessions",
  NO_USERS: "No users found",
  NO_SESSIONS: "No sessions found",
  USER_MANAGEMENT: "User Management",
  VIEW_ALL_USERS: "View All Users",
  NEW_USER: "New user registered",
  NEW_SESSION: "New session created",
} as const;

export const ADMIN_NAVIGATION = {
  DASHBOARD: "Dashboard",
  USER_MANAGEMENT: "User Management",
  ORGANIZATIONS: "Organizations",
  PERMISSIONS: "Permissions",
  ROLES: "Roles",
  API_KEYS: "API Keys",
  TASKS: "Tasks",
  DOCTOR: "Doctor / Diagnostics",
  MENU_TOGGLE: "Toggle menu",
  CLOSE_MENU: "Close menu",
} as const;

export const ADMIN_LAYOUT = {
  LOADING: "Loading...",
  ACCESS_DENIED: "Access Denied",
} as const;

export const ORGANIZATION_ROLES = {
  ADMIN: "admin",
  MEMBER: "member",
  OWNER: "owner",
  MY_CUSTOM_ROLE: "myCustomRole",
} as const;

export const ORGANIZATION_LABELS = {
  TITLE: "Organizations",
  CREATE_ORGANIZATION: "Create Organization",
  EDIT_ORGANIZATION: "Edit Organization",
  DELETE_ORGANIZATION: "Delete Organization",
  SET_ACTIVE: "Set Active",
  NAME: "Name",
  SLUG: "Slug",
  DESCRIPTION: "Description",
  CREATED_AT: "Created At",
  ACTIONS: "Actions",
  NO_ORGANIZATIONS: "No organizations found",
  LOADING: "Loading organizations...",
  SEARCH_ORGANIZATIONS: "Search organizations...",
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  MEMBERS: "Members",
  INVITATIONS: "Invitations",
  SETTINGS: "Settings",
  DASHBOARD: "Dashboard",
  STATUS: "Status",
  CONFIRM_DELETE: "Are you sure you want to delete this organization?",
  CONFIRM_LEAVE: "Are you sure you want to leave this organization?",
  SAVE: "Save",
  CANCEL: "Cancel",
  VIEW_DETAILS: "View Details",
  SAVING: "Saving...",
  BACK_TO_ORGANIZATIONS: "Back to Organizations",
  CREATED_ON: "Created on",
  REFRESH: "Refresh",
} as const;

export const ORGANIZATION_PLACEHOLDERS = {
  NAME: "Enter organization name",
  SLUG: "Enter organization slug",
  DESCRIPTION: "Enter organization description (optional)",
  SLUG_HINT: "e.g., my-organization",
} as const;

export const ORGANIZATION_ERRORS = {
  CREATE_FAILED: "Failed to create organization",
  UPDATE_FAILED: "Failed to update organization",
  DELETE_FAILED: "Failed to delete organization",
  SET_ACTIVE_FAILED: "Failed to set active organization",
  LOAD_ORGANIZATIONS_FAILED: "Failed to load organizations",
  LOAD_ORGANIZATION_FAILED: "Failed to load organization",
  ACCESS_DENIED: "Access denied",
  INVALID_NAME: "Invalid organization name",
  INVALID_SLUG: "Invalid organization slug",
  INVALID_SLUG_FORMAT: "Slug must be lowercase alphanumeric with hyphens",
  SLUG_REQUIRED: "Slug is required",
  NAME_TOO_LONG: "Name must be less than 100 characters",
} as const;

export const ORGANIZATION_SUCCESS = {
  ORGANIZATION_CREATED: "Organization created successfully",
  ORGANIZATION_UPDATED: "Organization updated successfully",
  ORGANIZATION_DELETED: "Organization deleted successfully",
  ORGANIZATION_ACTIVATED: "Organization activated successfully",
} as const;

export const MEMBER_LABELS = {
  TITLE: "Members",
  ADD_MEMBER: "Add Member",
  REMOVE_MEMBER: "Remove Member",
  UPDATE_ROLE: "Update Role",
  LEAVE_ORGANIZATION: "Leave Organization",
  EMAIL: "Email",
  ROLE: "Role",
  JOINED_AT: "Joined At",
  ACTIONS: "Actions",
  NO_MEMBERS: "No members found",
  LOADING: "Loading members...",
  SEARCH_MEMBERS: "Search members...",
  CONFIRM_REMOVE: "Are you sure you want to remove this member?",
  CONFIRM_LEAVE: "Are you sure you want to leave this organization?",
  CANCEL: "Cancel",
  SAVING: "Saving...",
  ADDING: "Adding...",
} as const;

export const MEMBER_PLACEHOLDERS = {
  EMAIL: "Enter member email",
  ROLE: "Select role",
  SELECT_MEMBER: "Select a member",
} as const;

export const MEMBER_ERRORS = {
  ADD_FAILED: "Failed to add member",
  REMOVE_FAILED: "Failed to remove member",
  UPDATE_ROLE_FAILED: "Failed to update member role",
  LEAVE_FAILED: "Failed to leave organization",
  LOAD_MEMBERS_FAILED: "Failed to load members",
  INVALID_EMAIL: "Invalid email address",
  INVALID_ROLE: "Invalid role",
  USER_ALREADY_MEMBER: "This user is already a member of this organization",
  USER_NOT_SELECTED: "Please select a user or enter an email address",
  SEARCH_FAILED: "Failed to search users",
  ONLY_OWNERS_CAN_REMOVE: "Only organization owners can remove members",
} as const;

export const MEMBER_SUCCESS = {
  MEMBER_ADDED: "Member added successfully",
  MEMBER_REMOVED: "Member removed successfully",
  ROLE_UPDATED: "Member role updated successfully",
  LEFT_ORGANIZATION: "Left organization successfully",
} as const;

export const USER_SEARCH_LABELS = {
  SEARCH_USERS: "Search users...",
  SELECT_USER: "Select a user",
  NO_USERS_FOUND: "No users found",
  LOADING_USERS: "Loading users...",
  USER_ALREADY_MEMBER: "This user is already a member",
  USER_NOT_FOUND: "User not found",
  ADD_EXISTING_USER: "Add existing user",
  INVITE_NEW_USER: "Invite new user by email",
} as const;

export const USER_SEARCH_PLACEHOLDERS = {
  SEARCH: "Search by email or name...",
  EMAIL: "Enter email address",
} as const;

export const ADD_MEMBER_DIALOG_LABELS = {
  TITLE: "Add Member",
  DESCRIPTION: "Search for an existing user or invite a new user by email",
  ADD_BUTTON: "Add Member",
  INVITE_BUTTON: "Send Invitation",
  CANCEL: "Cancel",
  ADD_EXISTING_USER: "Add existing user",
  INVITE_NEW_USER: "Invite new user by email",
} as const;

export const INVITATION_LABELS = {
  TITLE: "Invitations",
  SEND_INVITATION: "Send Invitation",
  ACCEPT_INVITATION: "Accept Invitation",
  REJECT_INVITATION: "Reject Invitation",
  CANCEL_INVITATION: "Cancel Invitation",
  RESEND_INVITATION: "Resend Invitation",
  EMAIL: "Email",
  ROLE: "Role",
  STATUS: "Status",
  SENT_AT: "Sent At",
  EXPIRES_AT: "Expires At",
  ACTIONS: "Actions",
  NO_INVITATIONS: "No invitations found",
  LOADING: "Loading invitations...",
  SEARCH_INVITATIONS: "Search invitations...",
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  EXPIRED: "Expired",
  CONFIRM_CANCEL: "Are you sure you want to cancel this invitation?",
  CONFIRM_REJECT: "Are you sure you want to reject this invitation?",
  SENDING: "Sending...",
} as const;

export const INVITATION_PLACEHOLDERS = {
  EMAIL: "Enter email address",
  ROLE: "Select role",
} as const;

export const INVITATION_ERRORS = {
  SEND_FAILED: "Failed to send invitation",
  ACCEPT_FAILED: "Failed to accept invitation",
  REJECT_FAILED: "Failed to reject invitation",
  CANCEL_FAILED: "Failed to cancel invitation",
  RESEND_FAILED: "Failed to resend invitation",
  LOAD_INVITATIONS_FAILED: "Failed to load invitations",
  INVALID_TOKEN: "Invalid invitation token",
  EXPIRED_TOKEN: "Invitation token has expired",
  MISSING_FIELDS: "Missing required fields: organizationId, email, role",
  INTERNAL_SERVER_ERROR: "Internal server error",
} as const;

export const INVITATION_SUCCESS = {
  INVITATION_SENT: "Invitation sent successfully",
  INVITATION_ACCEPTED: "Invitation accepted successfully",
  INVITATION_REJECTED: "Invitation rejected successfully",
  INVITATION_CANCELLED: "Invitation cancelled successfully",
  INVITATION_RESENT: "Invitation resent successfully",
} as const;

export const INVITATION_CONFIG = {
  EXPIRY_DAYS: 7,
} as const;

export const ORGANIZATION_SWITCHER = {
  SELECT_ORGANIZATION: "Select Organization",
  NO_ORGANIZATIONS: "No organizations available",
  SWITCHING: "Switching...",
  CURRENT: "Current",
} as const;

export const ORGANIZATION_CONTEXT = {
  LOAD_FAILED: "Failed to load organization context",
  AUTO_SELECT_FAILED: "Failed to automatically select organization",
  SWITCH_FAILED: "Failed to switch organization",
  HOOK_ERROR: "useOrganizationContext must be used within an OrganizationProvider",
} as const;

export const PAGE_CONTAINER = {
  CLASS: "container mx-auto px-4 py-8 md:py-12 max-w-7xl",
} as const;

export const PERMISSION_LABELS = {
  TITLE: "Permission Management",
  PERMISSIONS: "Permissions",
  ROLES: "Roles",
  USERS: "Users",
  RESOURCE: "Resource",
  ACTION: "Action",
  PERMISSION: "Permission",
  ROLE_NAME: "Role Name",
  USER_ROLE: "User Role",
  EFFECTIVE_PERMISSIONS: "Effective Permissions",
  NO_PERMISSIONS: "No permissions found",
  NO_ROLES: "No roles found",
  LOADING: "Loading...",
  SEARCH_PERMISSIONS: "Search permissions...",
  SEARCH_ROLES: "Search roles...",
  ASSIGN_ROLE: "Assign Role",
  UPDATE_ROLE: "Update Role",
  CURRENT_ROLE: "Current Role",
  SELECT_ROLE: "Select role",
  EDIT_PERMISSIONS: "Edit Permissions",
  SAVE_PERMISSIONS: "Save Permissions",
  CANCEL_EDIT: "Cancel",
  SELECT_ALL: "Select All",
  DESELECT_ALL: "Deselect All",
  PERMISSIONS_FOR_ROLE: "Permissions for",
} as const;

export const PERMISSION_ERRORS = {
  LOAD_PERMISSIONS_FAILED: "Failed to load permissions",
  LOAD_ROLES_FAILED: "Failed to load roles",
  LOAD_USER_PERMISSIONS_FAILED: "Failed to load user permissions",
  ASSIGN_ROLE_FAILED: "Failed to assign role",
  UPDATE_ROLE_FAILED: "Failed to update role",
  UPDATE_ROLE_PERMISSIONS_FAILED: "Failed to update role permissions",
  ACCESS_DENIED: "Access denied. Admin privileges required.",
  UNAUTHORIZED: "Unauthorized. Please log in to continue.",
  INSUFFICIENT_PERMISSIONS: "Insufficient permissions to perform this action.",
} as const;

export const PERMISSION_SUCCESS = {
  ROLE_ASSIGNED: "Role assigned successfully",
  ROLE_UPDATED: "Role updated successfully",
  ROLE_PERMISSIONS_UPDATED: "Role permissions updated successfully",
} as const;

export const ROLE_DISPLAY_NAMES = {
  admin: "Admin",
  user: "User",
  member: "Member",
  owner: "Owner",
  myCustomRole: "Custom Role",
  moderator: "Moderator",
  editor: "Editor",
  viewer: "Viewer",
  support: "Support",
} as const;

export const ROLE_DESCRIPTIONS = {
  admin: "Administrator with all permissions across all resources",
  user: "Standard user with basic permissions",
  member: "Organization member with limited permissions",
  owner: "Organization owner with full permissions",
  myCustomRole: "Custom role with specific permissions",
  moderator: "Can read, update, and delete content but cannot create new resources",
  editor: "Can read, create, and update content but cannot delete",
  viewer: "Read-only access to view content and resources",
  support: "Can read and update user/organization settings with limited permissions",
} as const;

export const ROLE_MANAGEMENT_LABELS = {
  TITLE: "Role Management",
  DESCRIPTION:
    "Manage roles and their permissions. Click Edit Permissions to modify what each role can do.",
  LOADING: "Loading...",
  SEARCH_ROLES: "Search roles...",
  NO_ROLES: "No roles found",
  EDIT_PERMISSIONS: "Edit Permissions",
  PERMISSIONS: "Permissions",
  NO_PERMISSIONS: "No permissions assigned",
  BACK_TO_ROLES: "Back to Roles",
  CREATE_ROLE: "Create Role",
  DELETE_ROLE: "Delete Role",
  ROLE_NAME: "Role Name",
  ROLE_NAME_PLACEHOLDER: "Enter role name",
  CONFIRM_DELETE: "Are you sure you want to delete this role?",
  SYSTEM_ROLE: "System Role",
  CUSTOM_ROLE: "Custom Role",
  PERMISSION_COUNT: "permissions",
} as const;

export const ROLE_MANAGEMENT_ERRORS = {
  LOAD_ROLES_FAILED: "Failed to load roles",
  UPDATE_ROLE_PERMISSIONS_FAILED: "Failed to update role permissions",
  INVALID_REQUEST_BODY: "Invalid request body. Permissions array is required.",
  ROLE_NOT_FOUND: "Role not found",
  CREATE_ROLE_FAILED: "Failed to create role",
  DELETE_ROLE_FAILED: "Failed to delete role",
  ROLE_ALREADY_EXISTS: "Role already exists",
  ROLE_NAME_INVALID: "Invalid role name",
  INVALID_PERMISSIONS: "Invalid permissions",
  ROLE_NOT_EDITABLE: "Role is not editable",
  ROLE_NOT_DELETABLE: "Role cannot be deleted",
} as const;

export const ROLE_MANAGEMENT_SUCCESS = {
  ROLE_CREATED: "Role created successfully",
  ROLE_UPDATED: "Role updated successfully",
  ROLE_DELETED: "Role deleted successfully",
} as const;

export const API_KEY_LABELS = {
  TITLE: "API Keys",
  CREATE_API_KEY: "Create API Key",
  EDIT_API_KEY: "Edit API Key",
  DELETE_API_KEY: "Delete API Key",
  VERIFY_API_KEY: "Verify API Key",
  NAME: "Name",
  PREFIX: "Prefix",
  EXPIRATION: "Expiration",
  EXPIRES_IN: "Expires In (days)",
  METADATA: "Metadata",
  PERMISSIONS: "Permissions",
  STATUS: "Status",
  ENABLED: "Enabled",
  DISABLED: "Disabled",
  EXPIRED: "Expired",
  ACTIVE: "Active",
  CREATED_AT: "Created At",
  EXPIRES_AT: "Expires At",
  ACTIONS: "Actions",
  NO_API_KEYS: "No API keys found",
  LOADING: "Loading API keys...",
  SEARCH_API_KEYS: "Search API keys...",
  CONFIRM_DELETE: "Are you sure you want to delete this API key?",
  CONFIRM_DELETE_EXPIRED: "Are you sure you want to delete all expired API keys?",
  SAVE: "Save",
  CANCEL: "Cancel",
  DELETE_ALL_EXPIRED: "Delete All Expired",
  VIEW_DETAILS: "View Details",
  COPY_KEY: "Copy Key",
  KEY_COPIED: "Key copied to clipboard",
  KEY_WARNING: "This is the only time you'll be able to see this key. Make sure to copy it now.",
  REMAINING: "Remaining Requests",
  REFILL_AMOUNT: "Refill Amount",
  REFILL_INTERVAL: "Refill Interval (ms)",
  RATE_LIMIT_ENABLED: "Rate Limiting Enabled",
  RATE_LIMIT_TIME_WINDOW: "Rate Limit Time Window (ms)",
  RATE_LIMIT_MAX: "Rate Limit Max Requests",
  VERIFY_KEY: "Verify Key",
  KEY_TO_VERIFY: "API Key to Verify",
  VERIFICATION_RESULT: "Verification Result",
  VALID: "Valid",
  INVALID: "Invalid",
  VERIFY_PERMISSIONS: "Verify Permissions (optional)",
  ADD_RESOURCE: "Add Resource",
  ADD_CUSTOM_ACTION: "Add custom action",
  REMOVE_RESOURCE: "Remove resource",
  ACTIONS_PLURAL: "actions",
  ACTION: "action",
  VISUAL_EDITOR: "Visual Editor",
  JSON_EDITOR: "JSON Editor",
  SERVER_ONLY_NOTE: "This field can only be set from the server",
} as const;

export const API_KEY_PLACEHOLDERS = {
  NAME: "Enter API key name",
  PREFIX: "Enter prefix (optional)",
  EXPIRES_IN: "Enter expiration in days (optional)",
  METADATA: 'Enter metadata as JSON (e.g., {"key": "value"})',
  PERMISSIONS: "Enter resource name",
  KEY_TO_VERIFY: "Enter API key to verify",
  VERIFY_PERMISSIONS: 'Enter permissions to verify (e.g., {"files": ["read"]})',
  REMAINING: "Enter remaining requests",
  REFILL_AMOUNT: "Enter refill amount",
  REFILL_INTERVAL: "Enter refill interval in milliseconds",
  RATE_LIMIT_TIME_WINDOW: "Enter time window in milliseconds",
  RATE_LIMIT_MAX: "Enter maximum requests",
  ACTION_NAME: "Enter action name",
} as const;

export const API_KEY_ERRORS = {
  CREATE_FAILED: "Failed to create API key",
  UPDATE_FAILED: "Failed to update API key",
  DELETE_FAILED: "Failed to delete API key",
  DELETE_EXPIRED_FAILED: "Failed to delete expired API keys",
  LOAD_API_KEYS_FAILED: "Failed to load API keys",
  LOAD_API_KEY_FAILED: "Failed to load API key",
  VERIFY_FAILED: "Failed to verify API key",
  INVALID_METADATA: "Invalid metadata format. Must be valid JSON.",
  INVALID_PERMISSIONS: "Invalid permissions format. Must be valid JSON.",
  INVALID_EXPIRATION: "Invalid expiration value",
} as const;

export const API_KEY_SUCCESS = {
  API_KEY_CREATED: "API key created successfully",
  API_KEY_UPDATED: "API key updated successfully",
  API_KEY_DELETED: "API key deleted successfully",
  EXPIRED_DELETED: "All expired API keys deleted successfully",
  API_KEY_ENABLED: "API key enabled successfully",
  API_KEY_DISABLED: "API key disabled successfully",
} as const;

export const API_KEY_CONFIG = {
  DEFAULT_EXPIRATION_DAYS: 30,
} as const;

export const ADMIN_FILTERS = {
  FILTER_BY_ROLE: "Filter by role",
  FILTER_BY_STATUS: "Filter by status",
  FILTER_BY_DATE: "Filter by date",
  ALL_ROLES: "All Roles",
  ALL_STATUSES: "All Statuses",
  DATE_FROM: "Date From",
  DATE_TO: "Date To",
  CLEAR_FILTERS: "Clear Filters",
  APPLY_FILTERS: "Apply Filters",
} as const;

export const ADMIN_BULK_ACTIONS = {
  BULK_ACTIONS: "Bulk Actions",
  DELETE_SELECTED: "Delete Selected",
  CHANGE_ROLE: "Change Role",
  BAN_SELECTED: "Ban Selected",
  UNBAN_SELECTED: "Unban Selected",
  NO_SELECTION: "No users selected",
  SELECTED_COUNT: "users selected",
  CONFIRM_BULK_DELETE: "Are you sure you want to delete the selected users?",
  CONFIRM_BULK_BAN: "Are you sure you want to ban the selected users?",
  CONFIRM_BULK_UNBAN: "Are you sure you want to unban the selected users?",
  CONFIRM_BULK_ROLE: "Are you sure you want to change the role of the selected users?",
  PROCESSING: "Processing...",
} as const;

export const ADMIN_USER_DETAILS = {
  USER_DETAILS: "User Details",
  USER_ID: "User ID",
  FULL_NAME: "Full Name",
  EMAIL_ADDRESS: "Email Address",
  ROLE: "Role",
  STATUS: "Status",
  CREATED_DATE: "Created Date",
  EMAIL_VERIFICATION: "Email Verification",
  VERIFIED: "Verified",
  NOT_VERIFIED: "Not Verified",
  BAN_INFORMATION: "Ban Information",
  BAN_REASON: "Ban Reason",
  BAN_EXPIRATION: "Ban Expiration",
  NO_BAN_REASON: "No reason provided",
  NO_EXPIRATION: "No expiration",
  EXPIRED: "Expired",
  CLOSE: "Close",
} as const;

export const ADMIN_PAGINATION = {
  ITEMS_PER_PAGE: "Items per page",
  SHOWING: "Showing",
  TO: "to",
  OF: "of",
  USERS: "users",
  FIRST_PAGE: "First page",
  LAST_PAGE: "Last page",
  PREVIOUS_PAGE: "Previous page",
  NEXT_PAGE: "Next page",
  PAGE: "Page",
} as const;

export const STATS_ERRORS = {
  LOAD_ADMIN_STATS_FAILED: "Failed to fetch admin statistics",
  LOAD_USER_STATS_FAILED: "Failed to fetch user statistics",
  USER_NOT_FOUND: "User not found",
} as const;

export const PROXY_ERRORS = {
  NOT_AUTHENTICATED: "Not authenticated",
  FAILED_TO_GENERATE_TOKEN: "Failed to generate token",
  BACKEND_UNAVAILABLE: "Backend service unavailable. Please ensure FastAPI is running.",
  PROXY_REQUEST_FAILED: "Proxy request failed",
  FAILED_TO_PROXY_REQUEST: "Failed to proxy request",
} as const;

export const STATS_LABELS = {
  SESSION_CREATED: "Session created",
} as const;

export const COMMON_LABELS = {
  CANCEL: "Cancel",
  ADDING: "Adding...",
  VIEW_MEMBERS: "View Members",
  HIDE: "Hide",
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  CONFIRM_REMOVE: "Are you sure you want to remove this member?",
} as const;

export const PERMISSION_RESOURCES = {
  PROJECT: "project",
  ORGANIZATION: "organization",
  USER: "user",
  API_KEY: "apiKey",
  ROLE: "role",
  MEMBER: "member",
  INVITATION: "invitation",
  FILE: "file",
  SETTINGS: "settings",
  SESSION: "session",
} as const;

export const PERMISSION_ACTIONS = {
  READ: "read",
  LIST: "list",
  VIEW: "view",
  CREATE: "create",
  SHARE: "share",
  UPDATE: "update",
  DELETE: "delete",
  BAN: "ban",
  UNBAN: "unban",
  SET_ROLE: "set-role",
  SET_PASSWORD: "set-password",
  IMPERSONATE: "impersonate",
  GET: "get",
  INVITE: "invite",
  REMOVE: "remove",
  REVOKE: "revoke",
  UPLOAD: "upload",
  DOWNLOAD: "download",
  CANCEL: "cancel",
} as const;

export const TASK_LABELS = {
  TITLE: "Tasks",
  CREATE_TASK: "Create Task",
  EDIT_TASK: "Edit Task",
  DELETE_TASK: "Delete Task",
  TASK_TITLE: "Title",
  TASK_DESCRIPTION: "Description",
  TASK_STATUS: "Status",
  TASK_CREATED_AT: "Created At",
  TASK_UPDATED_AT: "Updated At",
  ACTIONS: "Actions",
  NO_TASKS: "No tasks found",
  LOADING: "Loading tasks...",
  FILTER_BY_STATUS: "Filter by status",
  ALL_STATUSES: "All Statuses",
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  SAVE: "Save",
  CANCEL: "Cancel",
  CONFIRM_DELETE: "Are you sure you want to delete this task?",
  SAVING: "Saving...",
  CREATING: "Creating...",
  DELETING: "Deleting...",
  VIEW_DETAILS: "View Details",
  ITEMS_PER_PAGE: "Items per page",
  SHOWING: "Showing",
  TO: "to",
  OF: "of",
  TASKS: "tasks",
  FIRST_PAGE: "First page",
  LAST_PAGE: "Last page",
  PREVIOUS_PAGE: "Previous page",
  NEXT_PAGE: "Next page",
  PAGE: "Page",
} as const;

export const TASK_PLACEHOLDERS = {
  TITLE: "Enter task title",
  DESCRIPTION: "Enter task description (optional)",
  STATUS: "Select status",
} as const;

export const TASK_ERRORS = {
  CREATE_FAILED: "Failed to create task",
  UPDATE_FAILED: "Failed to update task",
  DELETE_FAILED: "Failed to delete task",
  LOAD_TASKS_FAILED: "Failed to load tasks",
  LOAD_TASK_FAILED: "Failed to load task",
  TITLE_REQUIRED: "Title is required",
  TITLE_TOO_LONG: "Title must be less than 255 characters",
  DESCRIPTION_TOO_LONG: "Description must be less than 5000 characters",
  INVALID_STATUS: "Invalid status",
} as const;

export const TASK_SUCCESS = {
  TASK_CREATED: "Task created successfully",
  TASK_UPDATED: "Task updated successfully",
  TASK_DELETED: "Task deleted successfully",
} as const;
