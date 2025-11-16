/**
 * Logging utility for both client and server-side code.
 * Provides consistent logging interface with environment-based log levels.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function getLogLevel(): LogLevel {
  if (typeof window === "undefined") {
    // Server-side: use environment variable
    const envLevel = process.env.LOG_LEVEL?.toLowerCase() || "info";
    return (envLevel as LogLevel) || "info";
  }
  // Client-side: use environment variable or default to warn in production
  const envLevel = process.env.NEXT_PUBLIC_LOG_LEVEL?.toLowerCase();
  if (envLevel && ["debug", "info", "warn", "error"].includes(envLevel)) {
    return envLevel as LogLevel;
  }
  // In production, only show warnings and errors on client
  return process.env.NODE_ENV === "production" ? "warn" : "info";
}

function shouldLog(level: LogLevel): boolean {
  const currentLevel = getLogLevel();
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

class Logger {
  private context: string;

  constructor(context = "app") {
    this.context = context;
  }

  debug(message: string, data?: Record<string, unknown>): void {
    if (shouldLog("debug")) {
      if (typeof window === "undefined") {
        // Server-side: use console for now (can be replaced with proper logging service)
        console.debug(`[${this.context}] ${message}`, data || "");
      } else {
        console.debug(`[${this.context}] ${message}`, data || "");
      }
    }
  }

  info(message: string, data?: Record<string, unknown>): void {
    if (shouldLog("info")) {
      if (typeof window === "undefined") {
        console.info(`[${this.context}] ${message}`, data || "");
      } else {
        console.info(`[${this.context}] ${message}`, data || "");
      }
    }
  }

  warn(message: string, data?: Record<string, unknown>): void {
    if (shouldLog("warn")) {
      if (typeof window === "undefined") {
        console.warn(`[${this.context}] ${message}`, data || "");
      } else {
        console.warn(`[${this.context}] ${message}`, data || "");
      }
    }
  }

  error(message: string, error?: Error | unknown, data?: Record<string, unknown>): void {
    if (shouldLog("error")) {
      const errorDetails = error instanceof Error ? error : { error };
      if (typeof window === "undefined") {
        console.error(`[${this.context}] ${message}`, errorDetails, data || "");
      } else {
        console.error(`[${this.context}] ${message}`, errorDetails, data || "");
      }
    }
  }
}

/**
 * Create a logger instance with a specific context.
 *
 * @param context - Context name for the logger (e.g., "api", "auth", "component")
 * @returns Logger instance
 */
export function createLogger(context: string): Logger {
  return new Logger(context);
}

/**
 * Default logger instance.
 */
export const logger = createLogger("app");
