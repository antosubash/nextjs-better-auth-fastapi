import { withErrorHandling } from "./utils";
import { getHeaders, requirePermission } from "./server-utils";
import { auth } from "../auth";
import { PERMISSION_RESOURCES, PERMISSION_ACTIONS, MEMBER_ERRORS } from "../constants";
import { organizationCoreService } from "./organization-core";

/**
 * Organization member-related methods
 */
export const organizationMemberService = {
  /**
   * List members of an organization
   */
  async listMembers(params?: {
    organizationId?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortDirection?: "asc" | "desc";
    filterField?: string;
    filterOperator?: "contains" | "eq" | "ne" | "lt" | "lte" | "gt" | "gte";
    filterValue?: string | number | boolean;
  }) {
    return withErrorHandling(
      "listMembers",
      async () => {
        await requirePermission(PERMISSION_RESOURCES.ORGANIZATION, PERMISSION_ACTIONS.READ);
        const headersList = await getHeaders();
        return await auth.api.listMembers({
          headers: headersList,
          query: params || {},
        });
      },
      params
    );
  },

  /**
   * Remove a member from an organization
   * Requires organization owner role
   */
  async removeMember(params: { memberIdOrEmail: string; organizationId: string }) {
    return withErrorHandling(
      "removeMember",
      async () => {
        // Validate required fields
        if (!params.organizationId || !params.memberIdOrEmail) {
          throw new Error(MEMBER_ERRORS.REMOVE_FAILED);
        }

        await requirePermission(PERMISSION_RESOURCES.ORGANIZATION, PERMISSION_ACTIONS.REMOVE);
        const headersList = await getHeaders();

        // Call Better Auth's removeMember API directly
        return await auth.api.removeMember({
          headers: headersList,
          body: {
            memberIdOrEmail: params.memberIdOrEmail,
            organizationId: params.organizationId,
          },
        });
      },
      { memberIdOrEmail: params.memberIdOrEmail, organizationId: params.organizationId }
    );
  },

  /**
   * Update member role
   */
  async updateMemberRole(params: {
    role: string | string[];
    memberId: string;
    organizationId?: string;
  }) {
    return withErrorHandling(
      "updateMemberRole",
      async () => {
        await requirePermission(PERMISSION_RESOURCES.ORGANIZATION, PERMISSION_ACTIONS.UPDATE);
        const headersList = await getHeaders();
        return await auth.api.updateMemberRole({
          headers: headersList,
          body: {
            role: params.role,
            memberId: params.memberId,
            organizationId: params.organizationId,
          },
        });
      },
      { memberId: params.memberId, organizationId: params.organizationId }
    );
  },

  /**
   * Get active member
   */
  async getActiveMember() {
    return withErrorHandling("getActiveMember", async () => {
      const headersList = await getHeaders();
      return await auth.api.getActiveMember({ headers: headersList });
    });
  },

  /**
   * Get active member role
   */
  async getActiveMemberRole() {
    return withErrorHandling("getActiveMemberRole", async () => {
      const headersList = await getHeaders();
      return await auth.api.getActiveMemberRole({ headers: headersList });
    });
  },

  /**
   * Add a member to an organization
   */
  async addMember(params: {
    userId: string;
    role: "member" | "owner" | ("member" | "owner")[];
    organizationId?: string;
    teamId?: string;
  }) {
    return withErrorHandling(
      "addMember",
      async () => {
        await requirePermission(PERMISSION_RESOURCES.ORGANIZATION, PERMISSION_ACTIONS.INVITE);
        const headersList = await getHeaders();
        return await auth.api.addMember({
          headers: headersList,
          body: {
            userId: params.userId,
            role: params.role,
            organizationId: params.organizationId,
            teamId: params.teamId,
          },
        });
      },
      { userId: params.userId, organizationId: params.organizationId }
    );
  },

  /**
   * Leave an organization
   */
  async leave(params: { organizationId: string }) {
    return withErrorHandling(
      "leave",
      async () => {
        const headersList = await getHeaders();
        return await auth.api.leaveOrganization({
          headers: headersList,
          body: {
            organizationId: params.organizationId,
          },
        });
      },
      { organizationId: params.organizationId }
    );
  },
};
