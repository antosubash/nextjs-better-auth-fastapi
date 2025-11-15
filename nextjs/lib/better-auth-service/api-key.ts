import { auth } from "../auth";
import { PERMISSION_ACTIONS, PERMISSION_RESOURCES } from "../constants";
import { getHeaders, requirePermission } from "./server-utils";
import { withErrorHandling } from "./utils";

/**
 * API Key-related methods
 */
export const apiKeyService = {
  /**
   * List all API keys for the current user
   */
  async listApiKeys() {
    return withErrorHandling("listApiKeys", async () => {
      await requirePermission(PERMISSION_RESOURCES.API_KEY, PERMISSION_ACTIONS.LIST);
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
        await requirePermission(PERMISSION_RESOURCES.API_KEY, PERMISSION_ACTIONS.READ);
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
        await requirePermission(PERMISSION_RESOURCES.API_KEY, PERMISSION_ACTIONS.CREATE);
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
        await requirePermission(PERMISSION_RESOURCES.API_KEY, PERMISSION_ACTIONS.UPDATE);
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
        await requirePermission(PERMISSION_RESOURCES.API_KEY, PERMISSION_ACTIONS.DELETE);
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
  async verifyApiKey(params: { key: string; permissions?: Record<string, string[]> }) {
    return withErrorHandling(
      "verifyApiKey",
      async () => {
        await requirePermission(PERMISSION_RESOURCES.API_KEY, PERMISSION_ACTIONS.READ);
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
