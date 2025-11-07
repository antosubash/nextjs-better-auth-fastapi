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

export const LANDING_PAGE = {
  HERO_TITLE: "Welcome to Better Auth",
  HERO_SUBTITLE: "Secure, fast, and easy authentication for your applications",
  HERO_DESCRIPTION: "Get started in minutes with our powerful authentication system built on Next.js and FastAPI.",
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

