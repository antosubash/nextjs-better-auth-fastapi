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
      DESCRIPTION:
        "Enterprise-grade security with modern authentication protocols",
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
  ADMIN: "admin",
  USER: "user",
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
  CREATED_AT: "Created At",
  BAN_REASON: "Ban Reason",
  BAN_EXPIRES: "Ban Expires",
  SAVE: "Save",
  CANCEL: "Cancel",
  CONFIRM_DELETE: "Are you sure you want to delete this user?",
  CONFIRM_BAN: "Are you sure you want to ban this user?",
  CONFIRM_UNBAN: "Are you sure you want to unban this user?",
} as const;

export const ADMIN_PLACEHOLDERS = {
  EMAIL: "Enter email",
  PASSWORD: "Enter password",
  NAME: "Enter name",
  ROLE: "Select role",
  BAN_REASON: "Enter ban reason (optional)",
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
} as const;

export const ADMIN_SUCCESS = {
  USER_CREATED: "User created successfully",
  USER_UPDATED: "User updated successfully",
  USER_DELETED: "User deleted successfully",
  USER_BANNED: "User banned successfully",
  USER_UNBANNED: "User unbanned successfully",
  ROLE_SET: "User role updated successfully",
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
  TEAMS: "Teams",
  INVITATIONS: "Invitations",
  SETTINGS: "Settings",
  DASHBOARD: "Dashboard",
  STATUS: "Status",
  CONFIRM_DELETE: "Are you sure you want to delete this organization?",
  CONFIRM_LEAVE: "Are you sure you want to leave this organization?",
  SAVE: "Save",
  CANCEL: "Cancel",
  VIEW_DETAILS: "View Details",
} as const;

export const ORGANIZATION_PLACEHOLDERS = {
  NAME: "Enter organization name",
  SLUG: "Enter organization slug",
  DESCRIPTION: "Enter organization description (optional)",
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
} as const;

export const MEMBER_PLACEHOLDERS = {
  EMAIL: "Enter member email",
  ROLE: "Select role",
} as const;

export const MEMBER_ERRORS = {
  ADD_FAILED: "Failed to add member",
  REMOVE_FAILED: "Failed to remove member",
  UPDATE_ROLE_FAILED: "Failed to update member role",
  LEAVE_FAILED: "Failed to leave organization",
  LOAD_MEMBERS_FAILED: "Failed to load members",
  INVALID_EMAIL: "Invalid email address",
  INVALID_ROLE: "Invalid role",
} as const;

export const MEMBER_SUCCESS = {
  MEMBER_ADDED: "Member added successfully",
  MEMBER_REMOVED: "Member removed successfully",
  ROLE_UPDATED: "Member role updated successfully",
  LEFT_ORGANIZATION: "Left organization successfully",
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
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  EXPIRED: "Expired",
  CONFIRM_CANCEL: "Are you sure you want to cancel this invitation?",
  CONFIRM_REJECT: "Are you sure you want to reject this invitation?",
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

export const TEAM_LABELS = {
  TITLE: "Teams",
  CREATE_TEAM: "Create Team",
  EDIT_TEAM: "Edit Team",
  DELETE_TEAM: "Delete Team",
  SET_ACTIVE: "Set Active Team",
  NAME: "Name",
  CREATED_AT: "Created At",
  ACTIONS: "Actions",
  NO_TEAMS: "No teams found",
  LOADING: "Loading teams...",
  MEMBERS: "Team Members",
  ADD_MEMBER: "Add Team Member",
  REMOVE_MEMBER: "Remove Team Member",
  CONFIRM_DELETE: "Are you sure you want to delete this team?",
} as const;

export const TEAM_PLACEHOLDERS = {
  NAME: "Enter team name",
} as const;

export const TEAM_ERRORS = {
  CREATE_FAILED: "Failed to create team",
  UPDATE_FAILED: "Failed to update team",
  DELETE_FAILED: "Failed to delete team",
  SET_ACTIVE_FAILED: "Failed to set active team",
  ADD_MEMBER_FAILED: "Failed to add team member",
  REMOVE_MEMBER_FAILED: "Failed to remove team member",
  LOAD_TEAMS_FAILED: "Failed to load teams",
  LOAD_TEAM_FAILED: "Failed to load team",
  INVALID_NAME: "Invalid team name",
} as const;

export const TEAM_SUCCESS = {
  TEAM_CREATED: "Team created successfully",
  TEAM_UPDATED: "Team updated successfully",
  TEAM_DELETED: "Team deleted successfully",
  TEAM_ACTIVATED: "Team activated successfully",
  MEMBER_ADDED: "Team member added successfully",
  MEMBER_REMOVED: "Team member removed successfully",
} as const;

export const ORGANIZATION_SWITCHER = {
  SELECT_ORGANIZATION: "Select Organization",
  NO_ORGANIZATIONS: "No organizations available",
  SWITCHING: "Switching...",
  CURRENT: "Current",
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
} as const;

export const PERMISSION_ERRORS = {
  LOAD_PERMISSIONS_FAILED: "Failed to load permissions",
  LOAD_ROLES_FAILED: "Failed to load roles",
  LOAD_USER_PERMISSIONS_FAILED: "Failed to load user permissions",
  ASSIGN_ROLE_FAILED: "Failed to assign role",
  UPDATE_ROLE_FAILED: "Failed to update role",
  ACCESS_DENIED: "Access denied. Admin privileges required.",
} as const;

export const PERMISSION_SUCCESS = {
  ROLE_ASSIGNED: "Role assigned successfully",
  ROLE_UPDATED: "Role updated successfully",
} as const;

export const ROLE_DISPLAY_NAMES = {
  admin: "Admin",
  user: "User",
  member: "Member",
  owner: "Owner",
  myCustomRole: "Custom Role",
} as const;

export const ROLE_DESCRIPTIONS = {
  admin: "Administrator with elevated permissions",
  user: "Standard user with basic permissions",
  member: "Organization member with limited permissions",
  owner: "Organization owner with full permissions",
  myCustomRole: "Custom role with specific permissions",
} as const;
