import { withErrorHandling, getHeaders, requirePermission } from "./utils";
import { auth } from "../auth";
import { PERMISSION_RESOURCES, PERMISSION_ACTIONS } from "../constants";

/**
 * Admin-related methods
 */
export const adminService = {
  /**
   * List all users (admin only)
   */
  async listUsers(params?: {
    searchValue?: string;
    searchField?: "email" | "name";
    searchOperator?: "contains" | "starts_with" | "ends_with";
    limit?: string | number;
    offset?: string | number;
    sortBy?: string;
    sortDirection?: "asc" | "desc";
    filterField?: string;
    filterValue?: string | number | boolean;
    filterOperator?: "eq" | "ne" | "lt" | "lte" | "gt" | "gte";
  }) {
    return withErrorHandling(
      "listUsers",
      async () => {
        await requirePermission(PERMISSION_RESOURCES.USER, PERMISSION_ACTIONS.LIST);
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
    role?: string | string[];
    data?: Record<string, unknown>;
  }) {
    return withErrorHandling(
      "createUser",
      async () => {
        await requirePermission(PERMISSION_RESOURCES.USER, PERMISSION_ACTIONS.CREATE);
        return await auth.api.createUser({
          body: params as {
            email: string;
            password: string;
            name: string;
            role?:
              | "admin"
              | "myCustomRole"
              | "moderator"
              | "editor"
              | "viewer"
              | "support"
              | (
                  | "admin"
                  | "myCustomRole"
                  | "moderator"
                  | "editor"
                  | "viewer"
                  | "support"
                )[];
            data?: Record<string, unknown>;
          },
        });
      },
      { email: params.email, name: params.name }
    );
  },

  /**
   * Set user role (admin only)
   */
  async setRole(params: {
    userId: string;
    role: string;
  }) {
    return withErrorHandling(
      "setRole",
      async () => {
        await requirePermission(PERMISSION_RESOURCES.USER, PERMISSION_ACTIONS.SET_ROLE);
        const headersList = await getHeaders();
        return await auth.api.setRole({
          headers: headersList,
          body: {
            userId: params.userId,
            role: params.role as
              | "admin"
              | "myCustomRole"
              | "moderator"
              | "editor"
              | "viewer"
              | "support"
              | (
                  | "admin"
                  | "myCustomRole"
                  | "moderator"
                  | "editor"
                  | "viewer"
                  | "support"
                )[],
          },
        });
      },
      { userId: params.userId, role: params.role }
    );
  },

  /**
   * Set user password (admin only)
   */
  async setUserPassword(params: {
    userId: string;
    newPassword: string;
  }) {
    return withErrorHandling(
      "setUserPassword",
      async () => {
        await requirePermission(PERMISSION_RESOURCES.USER, PERMISSION_ACTIONS.SET_PASSWORD);
        const headersList = await getHeaders();
        return await auth.api.setUserPassword({
          headers: headersList,
          body: {
            userId: params.userId,
            newPassword: params.newPassword,
          },
        });
      },
      { userId: params.userId }
    );
  },

  /**
   * Update user (admin only)
   */
  async updateUser(params: {
    userId: string;
    data: Record<string, unknown>;
  }) {
    return withErrorHandling(
      "updateUser",
      async () => {
        await requirePermission(PERMISSION_RESOURCES.USER, PERMISSION_ACTIONS.UPDATE);
        const headersList = await getHeaders();
        return await auth.api.adminUpdateUser({
          headers: headersList,
          body: {
            userId: params.userId,
            data: params.data,
          },
        });
      },
      { userId: params.userId }
    );
  },

  /**
   * Ban a user (admin only)
   */
  async banUser(params: {
    userId: string;
    banReason?: string;
    banExpiresIn?: number;
  }) {
    return withErrorHandling(
      "banUser",
      async () => {
        await requirePermission(PERMISSION_RESOURCES.USER, PERMISSION_ACTIONS.BAN);
        const headersList = await getHeaders();
        return await auth.api.banUser({
          headers: headersList,
          body: {
            userId: params.userId,
            banReason: params.banReason,
            banExpiresIn: params.banExpiresIn,
          },
        });
      },
      { userId: params.userId }
    );
  },

  /**
   * Unban a user (admin only)
   */
  async unbanUser(params: {
    userId: string;
  }) {
    return withErrorHandling(
      "unbanUser",
      async () => {
        await requirePermission(PERMISSION_RESOURCES.USER, PERMISSION_ACTIONS.UNBAN);
        const headersList = await getHeaders();
        return await auth.api.unbanUser({
          headers: headersList,
          body: {
            userId: params.userId,
          },
        });
      },
      { userId: params.userId }
    );
  },

  /**
   * List user sessions (admin only)
   */
  async listUserSessions(params: {
    userId: string;
  }) {
    return withErrorHandling(
      "listUserSessions",
      async () => {
        await requirePermission(PERMISSION_RESOURCES.SESSION, PERMISSION_ACTIONS.LIST);
        const headersList = await getHeaders();
        return await auth.api.listUserSessions({
          headers: headersList,
          body: {
            userId: params.userId,
          },
        });
      },
      { userId: params.userId }
    );
  },

  /**
   * Revoke a specific user session (admin only)
   */
  async revokeUserSession(params: {
    sessionToken: string;
  }) {
    return withErrorHandling(
      "revokeUserSession",
      async () => {
        await requirePermission(PERMISSION_RESOURCES.SESSION, PERMISSION_ACTIONS.REVOKE);
        const headersList = await getHeaders();
        return await auth.api.revokeUserSession({
          headers: headersList,
          body: {
            sessionToken: params.sessionToken,
          },
        });
      },
      { hasSessionToken: !!params.sessionToken }
    );
  },

  /**
   * Revoke all sessions for a user (admin only)
   */
  async revokeUserSessions(params: {
    userId: string;
  }) {
    return withErrorHandling(
      "revokeUserSessions",
      async () => {
        await requirePermission(PERMISSION_RESOURCES.SESSION, PERMISSION_ACTIONS.REVOKE);
        const headersList = await getHeaders();
        return await auth.api.revokeUserSessions({
          headers: headersList,
          body: {
            userId: params.userId,
          },
        });
      },
      { userId: params.userId }
    );
  },

  /**
   * Impersonate a user (admin only)
   */
  async impersonateUser(params: {
    userId: string;
  }) {
    return withErrorHandling(
      "impersonateUser",
      async () => {
        await requirePermission(PERMISSION_RESOURCES.USER, PERMISSION_ACTIONS.IMPERSONATE);
        const headersList = await getHeaders();
        return await auth.api.impersonateUser({
          headers: headersList,
          body: {
            userId: params.userId,
          },
        });
      },
      { userId: params.userId }
    );
  },

  /**
   * Stop impersonating user (admin only)
   */
  async stopImpersonating() {
    return withErrorHandling("stopImpersonating", async () => {
      await requirePermission(PERMISSION_RESOURCES.USER, PERMISSION_ACTIONS.IMPERSONATE);
      const headersList = await getHeaders();
      return await auth.api.stopImpersonating({
        headers: headersList,
      });
    });
  },

  /**
   * Remove a user (admin only)
   */
  async removeUser(params: {
    userId: string;
  }) {
    return withErrorHandling(
      "removeUser",
      async () => {
        await requirePermission(PERMISSION_RESOURCES.USER, PERMISSION_ACTIONS.DELETE);
        const headersList = await getHeaders();
        return await auth.api.removeUser({
          headers: headersList,
          body: {
            userId: params.userId,
          },
        });
      },
      { userId: params.userId }
    );
  },

  /**
   * Check if user has permission (admin only)
   */
  async userHasPermission(params: {
    userId: string;
    role?: string;
    permission?: Record<string, string[]>;
    permissions?: Record<string, string[]>;
  }) {
    return withErrorHandling(
      "userHasPermission",
      async () => {
        await requirePermission(PERMISSION_RESOURCES.USER, PERMISSION_ACTIONS.GET);
        const headersList = await getHeaders();
        return await auth.api.userHasPermission({
          headers: headersList,
          body: {
            userId: params.userId,
            role: params.role as
              | "admin"
              | "myCustomRole"
              | "moderator"
              | "editor"
              | "viewer"
              | "support"
              | undefined,
            permission: params.permission,
            permissions: params.permissions,
          } as Parameters<typeof auth.api.userHasPermission>[0]["body"],
        });
      },
      { userId: params.userId }
    );
  },
};

