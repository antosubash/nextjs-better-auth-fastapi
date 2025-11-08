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
