import { withErrorHandling } from "./utils";
import { getHeaders, requirePermission } from "./server-utils";
import { auth } from "../auth";
import { PERMISSION_RESOURCES, PERMISSION_ACTIONS } from "../constants";

/**
 * Organization team-related methods
 */
export const organizationTeamService = {
  /**
   * Create a team
   */
  async createTeam(params: {
    name: string;
    organizationId?: string;
  }) {
    return withErrorHandling(
      "createTeam",
      async () => {
        await requirePermission(PERMISSION_RESOURCES.TEAM, PERMISSION_ACTIONS.CREATE);
        const headersList = await getHeaders();
        return await auth.api.createTeam({
          headers: headersList,
          body: {
            name: params.name,
            organizationId: params.organizationId,
          },
        });
      },
      { name: params.name, organizationId: params.organizationId }
    );
  },

  /**
   * List teams
   */
  async listTeams(params?: {
    organizationId?: string;
  }) {
    return withErrorHandling(
      "listTeams",
      async () => {
        await requirePermission(PERMISSION_RESOURCES.TEAM, PERMISSION_ACTIONS.LIST);
        const headersList = await getHeaders();
        return await auth.api.listOrganizationTeams({
          headers: headersList,
          query: params || {},
        });
      },
      params
    );
  },

  /**
   * Update a team
   */
  async updateTeam(params: {
    teamId: string;
    data: Record<string, unknown>;
  }) {
    return withErrorHandling(
      "updateTeam",
      async () => {
        await requirePermission(PERMISSION_RESOURCES.TEAM, PERMISSION_ACTIONS.UPDATE);
        const headersList = await getHeaders();
        return await auth.api.updateTeam({
          headers: headersList,
          body: {
            teamId: params.teamId,
            data: params.data,
          },
        });
      },
      { teamId: params.teamId }
    );
  },

  /**
   * Remove a team
   */
  async removeTeam(params: {
    teamId: string;
    organizationId?: string;
  }) {
    return withErrorHandling(
      "removeTeam",
      async () => {
        await requirePermission(PERMISSION_RESOURCES.TEAM, PERMISSION_ACTIONS.DELETE);
        const headersList = await getHeaders();
        return await auth.api.removeTeam({
          headers: headersList,
          body: {
            teamId: params.teamId,
            organizationId: params.organizationId,
          },
        });
      },
      { teamId: params.teamId, organizationId: params.organizationId }
    );
  },

  /**
   * Set active team
   */
  async setActiveTeam(params: {
    teamId?: string;
  }) {
    return withErrorHandling(
      "setActiveTeam",
      async () => {
        const headersList = await getHeaders();
        return await auth.api.setActiveTeam({
          headers: headersList,
          body: {
            teamId: params.teamId,
          },
        });
      },
      { teamId: params.teamId }
    );
  },

  /**
   * List user teams
   */
  async listUserTeams() {
    return withErrorHandling("listUserTeams", async () => {
      await requirePermission(PERMISSION_RESOURCES.TEAM, PERMISSION_ACTIONS.LIST);
      const headersList = await getHeaders();
      return await auth.api.listUserTeams({ headers: headersList });
    });
  },

  /**
   * List team members
   */
  async listTeamMembers(params: {
    teamId: string;
  }) {
    return withErrorHandling(
      "listTeamMembers",
      async () => {
        await requirePermission(PERMISSION_RESOURCES.TEAM, PERMISSION_ACTIONS.READ);
        const headersList = await getHeaders();
        return await auth.api.listTeamMembers({
          headers: headersList,
          query: {
            teamId: params.teamId,
          },
        });
      },
      { teamId: params.teamId }
    );
  },

  /**
   * Add a member to a team
   */
  async addTeamMember(params: {
    teamId: string;
    userId: string;
  }) {
    return withErrorHandling(
      "addTeamMember",
      async () => {
        // await requirePermission(PERMISSION_RESOURCES.TEAM, PERMISSION_ACTIONS.INVITE);
        console.log("addTeamMember params", params);
        const headersList = await getHeaders();
        return await auth.api.addTeamMember({
          headers: headersList,
          body: {
            teamId: params.teamId,
            userId: params.userId,
          },
        });
      },
      { teamId: params.teamId, userId: params.userId }
    );
  },

  /**
   * Remove a member from a team
   */
  async removeTeamMember(params: {
    teamId: string;
    userId: string;
  }) {
    return withErrorHandling(
      "removeTeamMember",
      async () => {
        await requirePermission(PERMISSION_RESOURCES.TEAM, PERMISSION_ACTIONS.UPDATE);
        const headersList = await getHeaders();
        return await auth.api.removeTeamMember({
          headers: headersList,
          body: {
            teamId: params.teamId,
            userId: params.userId,
          },
        });
      },
      { teamId: params.teamId, userId: params.userId }
    );
  },
};

