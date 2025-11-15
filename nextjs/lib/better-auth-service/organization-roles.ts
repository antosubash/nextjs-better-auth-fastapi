import { auth } from "../auth";
import { PERMISSION_ACTIONS, PERMISSION_RESOURCES } from "../constants";
import { getHeaders, requirePermission } from "./server-utils";
import type { OrganizationRoleAPI } from "./utils";
import { withErrorHandling } from "./utils";

/**
 * Organization role-related methods
 */
export const organizationRoleService = {
  /**
   * Create an organization role
   */
  async createRole(params: {
    role: string;
    permission: Record<string, string[]>;
    organizationId?: string;
  }) {
    return withErrorHandling(
      "createRole",
      async () => {
        await requirePermission(PERMISSION_RESOURCES.ROLE, PERMISSION_ACTIONS.CREATE);
        const headersList = await getHeaders();
        // Note: Organization role APIs may not be available in all Better Auth versions
        const orgRoleAPI = auth.api as OrganizationRoleAPI;
        if (!orgRoleAPI.createOrgRole) {
          throw new Error("Organization role API not available");
        }
        return await orgRoleAPI.createOrgRole({
          headers: headersList,
          body: {
            role: params.role,
            permission: params.permission,
            organizationId: params.organizationId,
          },
        });
      },
      { role: params.role, organizationId: params.organizationId }
    );
  },

  /**
   * Delete an organization role
   */
  async deleteRole(params: { roleName?: string; roleId?: string; organizationId?: string }) {
    return withErrorHandling(
      "deleteRole",
      async () => {
        await requirePermission(PERMISSION_RESOURCES.ROLE, PERMISSION_ACTIONS.DELETE);
        const headersList = await getHeaders();
        const orgRoleAPI = auth.api as OrganizationRoleAPI;
        if (!orgRoleAPI.deleteOrgRole) {
          throw new Error("Organization role API not available");
        }
        return await orgRoleAPI.deleteOrgRole({
          headers: headersList,
          body: {
            roleName: params.roleName,
            roleId: params.roleId,
            organizationId: params.organizationId,
          },
        });
      },
      { roleName: params.roleName, roleId: params.roleId, organizationId: params.organizationId }
    );
  },

  /**
   * List organization roles
   */
  async listRoles(params?: { organizationId?: string }) {
    return withErrorHandling(
      "listRoles",
      async () => {
        await requirePermission(PERMISSION_RESOURCES.ROLE, PERMISSION_ACTIONS.LIST);
        const headersList = await getHeaders();
        const orgRoleAPI = auth.api as OrganizationRoleAPI;
        if (!orgRoleAPI.listOrgRoles) {
          throw new Error("Organization role API not available");
        }
        return await orgRoleAPI.listOrgRoles({
          headers: headersList,
          query: params || {},
        });
      },
      params
    );
  },

  /**
   * Get an organization role
   */
  async getRole(params: { roleName?: string; roleId?: string; organizationId?: string }) {
    return withErrorHandling(
      "getRole",
      async () => {
        await requirePermission(PERMISSION_RESOURCES.ROLE, PERMISSION_ACTIONS.READ);
        const headersList = await getHeaders();
        const orgRoleAPI = auth.api as OrganizationRoleAPI;
        if (!orgRoleAPI.getOrgRole) {
          throw new Error("Organization role API not available");
        }
        return await orgRoleAPI.getOrgRole({
          headers: headersList,
          query: {
            roleName: params.roleName,
            roleId: params.roleId,
            organizationId: params.organizationId,
          },
        });
      },
      { roleName: params.roleName, roleId: params.roleId, organizationId: params.organizationId }
    );
  },

  /**
   * Update an organization role
   */
  async updateRole(params: {
    roleName?: string;
    roleId?: string;
    organizationId?: string;
    data: {
      permission?: Record<string, string[]>;
      roleName?: string;
    };
  }) {
    return withErrorHandling(
      "updateRole",
      async () => {
        await requirePermission(PERMISSION_RESOURCES.ROLE, PERMISSION_ACTIONS.UPDATE);
        const headersList = await getHeaders();
        const orgRoleAPI = auth.api as OrganizationRoleAPI;
        if (!orgRoleAPI.updateOrgRole) {
          throw new Error("Organization role API not available");
        }
        return await orgRoleAPI.updateOrgRole({
          headers: headersList,
          body: {
            roleName: params.roleName,
            roleId: params.roleId,
            organizationId: params.organizationId,
            data: params.data,
          },
        });
      },
      { roleName: params.roleName, roleId: params.roleId, organizationId: params.organizationId }
    );
  },
};
