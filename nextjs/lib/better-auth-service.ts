import { headers } from "next/headers";
import { auth } from "./auth";

/**
 * Better Auth Service
 * 
 * Centralized service for all Better Auth API calls with:
 * - Automatic header handling
 * - Error handling
 * - Structured logging
 */

type LogLevel = "info" | "error" | "warn";

interface LogContext {
  method: string;
  duration?: number;
  error?: unknown;
  params?: Record<string, unknown>;
}

function log(level: LogLevel, context: LogContext) {
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

async function withErrorHandling<T>(
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

async function getHeaders() {
  return await headers();
}

/**
 * Session-related methods
 */
export const sessionService = {
  /**
   * Get the current session
   */
  async getSession() {
    return withErrorHandling("getSession", async () => {
      const headersList = await getHeaders();
      return await auth.api.getSession({ headers: headersList });
    });
  },

  /**
   * Get a JWT token for the current session
   */
  async getToken() {
    return withErrorHandling("getToken", async () => {
      const headersList = await getHeaders();
      return await auth.api.getToken({ headers: headersList });
    });
  },
};

/**
 * API Key-related methods
 */
export const apiKeyService = {
  /**
   * List all API keys for the current user
   */
  async listApiKeys() {
    return withErrorHandling("listApiKeys", async () => {
      const headersList = await getHeaders();
      return await auth.api.listApiKeys({ headers: headersList });
    });
  },

  /**
   * Get a specific API key by ID
   */
  async getApiKey(id: string) {
    return withErrorHandling(
      "getApiKey",
      async () => {
        const headersList = await getHeaders();
        return await auth.api.getApiKey({
          headers: headersList,
          query: { id },
        });
      },
      { id }
    );
  },

  /**
   * Create a new API key
   */
  async createApiKey(params: {
    name: string;
    prefix?: string;
    expiresIn?: number;
    metadata?: Record<string, unknown>;
    permissions?: Record<string, string[]>;
    userId: string;
  }) {
    return withErrorHandling(
      "createApiKey",
      async () => {
        return await auth.api.createApiKey({
          body: {
            name: params.name,
            prefix: params.prefix,
            expiresIn: params.expiresIn,
            metadata: params.metadata,
            permissions: params.permissions,
            userId: params.userId,
          },
        });
      },
      { name: params.name, userId: params.userId }
    );
  },

  /**
   * Update an existing API key
   */
  async updateApiKey(params: {
    keyId: string;
    name?: string;
    expiresIn?: number;
    metadata?: Record<string, unknown>;
    permissions?: Record<string, string[]>;
    enabled?: boolean;
  }) {
    return withErrorHandling(
      "updateApiKey",
      async () => {
        const headersList = await getHeaders();
        return await auth.api.updateApiKey({
          headers: headersList,
          body: {
            keyId: params.keyId,
            name: params.name,
            expiresIn: params.expiresIn,
            metadata: params.metadata,
            permissions: params.permissions,
            enabled: params.enabled,
          },
        });
      },
      { keyId: params.keyId }
    );
  },

  /**
   * Delete an API key
   */
  async deleteApiKey(keyId: string) {
    return withErrorHandling(
      "deleteApiKey",
      async () => {
        const headersList = await getHeaders();
        return await auth.api.deleteApiKey({
          headers: headersList,
          body: { keyId },
        });
      },
      { keyId }
    );
  },

  /**
   * Verify an API key
   */
  async verifyApiKey(params: {
    key: string;
    permissions?: Record<string, string[]>;
  }) {
    return withErrorHandling(
      "verifyApiKey",
      async () => {
        const headersList = await getHeaders();
        return await auth.api.verifyApiKey({
          headers: headersList,
          body: {
            key: params.key,
            permissions: params.permissions,
          },
        });
      },
      { hasKey: !!params.key }
    );
  },

  /**
   * Delete all expired API keys
   */
  async deleteAllExpiredApiKeys() {
    return withErrorHandling("deleteAllExpiredApiKeys", async () => {
      return await auth.api.deleteAllExpiredApiKeys();
    });
  },
};

/**
 * Organization-related methods
 */
export const organizationService = {
  /**
   * List all organizations
   */
  async listOrganizations() {
    return withErrorHandling("listOrganizations", async () => {
      const headersList = await getHeaders();
      return await auth.api.listOrganizations({ headers: headersList });
    });
  },

  /**
   * Get a specific organization by ID
   */
  async getOrganization(id: string) {
    return withErrorHandling("getOrganization", async () => {
      const headersList = await getHeaders();
      return await auth.api.getFullOrganization({ headers: headersList, query: { organizationId: id } });
    });
  },
  

  /**
   * Create an invitation
   */
  async createInvitation(params: {
    email: string;
    role: string;
    organizationId: string;
  }) {
    return withErrorHandling(
      "createInvitation",
      async () => {
        const headersList = await getHeaders();
        return await auth.api.createInvitation({
          headers: headersList,
          body: {
            email: params.email,
            role: params.role as "member" | "owner",
            organizationId: params.organizationId,
          },
        });
      },
      { email: params.email, organizationId: params.organizationId }
    );
  },
};

/**
 * Admin-related methods
 */
export const adminService = {
  /**
   * List all users (admin only)
   */
  async listUsers(params?: { limit?: string; offset?: string }) {
    return withErrorHandling(
      "listUsers",
      async () => {
        const headersList = await getHeaders();
        return await auth.api.listUsers({
          headers: headersList,
          query: params || {},
        });
      },
      params
    );
  },

  /**
   * Create a new user (admin only)
   */
  async createUser(params: {
    email: string;
    password: string;
    name: string;
    role?: ("admin" | "myCustomRole" | "moderator" | "editor" | "viewer" | "support")[];
  }) {
    return withErrorHandling(
      "createUser",
      async () => {
        return await auth.api.createUser({
          body: params,
        });
      },
      { email: params.email, name: params.name }
    );
  },
};

/**
 * Main Better Auth Service
 * Export all services as a single object
 */
export const betterAuthService = {
  session: sessionService,
  apiKey: apiKeyService,
  organization: organizationService,
  admin: adminService,
};

export default betterAuthService;

