/**
 * Client-safe utilities for Better Auth Service
 * These functions can be used in both Client and Server Components
 */

/**
 * Type definitions for organization role APIs
 * These may not be available in all Better Auth versions
 */
export interface OrganizationRoleAPI {
  createOrgRole?: (params: {
    headers: Headers;
    body: {
      role: string;
      permission: Record<string, string[]>;
      organizationId?: string;
    };
  }) => Promise<unknown>;
  deleteOrgRole?: (params: {
    headers: Headers;
    body: {
      roleName?: string;
      roleId?: string;
      organizationId?: string;
    };
  }) => Promise<unknown>;
  listOrgRoles?: (params: {
    headers: Headers;
    query: { organizationId?: string };
  }) => Promise<unknown>;
  getOrgRole?: (params: {
    headers: Headers;
    query: {
      roleName?: string;
      roleId?: string;
      organizationId?: string;
    };
  }) => Promise<unknown>;
  updateOrgRole?: (params: {
    headers: Headers;
    body: {
      roleName?: string;
      roleId?: string;
      organizationId?: string;
      data: {
        permission?: Record<string, string[]>;
        roleName?: string;
      };
    };
  }) => Promise<unknown>;
}

type LogLevel = "info" | "error" | "warn";

interface LogContext {
  method: string;
  duration?: number;
  error?: unknown;
  params?: Record<string, unknown>;
}

export function log(level: LogLevel, context: LogContext) {
  const { method, duration, error, params } = context;
  const timestamp = new Date().toISOString();
  const sanitizedParams = params
    ? Object.fromEntries(
        Object.entries(params).map(([key, value]) => {
          // Sanitize sensitive data
          if (
            typeof value === "string" &&
            (key.toLowerCase().includes("password") ||
              key.toLowerCase().includes("token") ||
              key.toLowerCase().includes("key") ||
              key.toLowerCase().includes("secret"))
          ) {
            return [key, "[REDACTED]"];
          }
          return [key, value];
        })
      )
    : undefined;

  const logMessage: Record<string, unknown> = {
    timestamp,
    level,
    service: "better-auth",
    method,
  };

  if (duration !== undefined) {
    logMessage.duration = `${duration}ms`;
  }

  if (sanitizedParams) {
    logMessage.params = sanitizedParams;
  }

  if (error) {
    logMessage.error =
      error instanceof Error
        ? {
            message: error.message,
            name: error.name,
            stack: error.stack,
          }
        : String(error);
  }

  if (level === "error") {
    console.error(JSON.stringify(logMessage, null, 2));
  } else if (level === "warn") {
    console.warn(JSON.stringify(logMessage, null, 2));
  } else {
    console.log(JSON.stringify(logMessage, null, 2));
  }
}

export async function withErrorHandling<T>(
  methodName: string,
  fn: () => Promise<T>,
  params?: Record<string, unknown>
): Promise<T> {
  const startTime = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    log("info", { method: methodName, duration, params });
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    log("error", { method: methodName, duration, error, params });
    throw error;
  }
}


