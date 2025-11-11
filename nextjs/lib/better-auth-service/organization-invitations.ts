import { withErrorHandling } from "./utils";
import { getHeaders, requirePermission } from "./server-utils";
import { auth } from "../auth";
import { PERMISSION_RESOURCES, PERMISSION_ACTIONS } from "../constants";

/**
 * Organization invitation-related methods
 */
export const organizationInvitationService = {
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
        await requirePermission(PERMISSION_RESOURCES.TEAM, PERMISSION_ACTIONS.INVITE);
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

  /**
   * Accept an invitation
   */
  async acceptInvitation(params: {
    invitationId: string;
  }) {
    return withErrorHandling(
      "acceptInvitation",
      async () => {
        const headersList = await getHeaders();
        return await auth.api.acceptInvitation({
          headers: headersList,
          body: {
            invitationId: params.invitationId,
          },
        });
      },
      { invitationId: params.invitationId }
    );
  },

  /**
   * Cancel an invitation
   */
  async cancelInvitation(params: {
    invitationId: string;
  }) {
    return withErrorHandling(
      "cancelInvitation",
      async () => {
        await requirePermission(PERMISSION_RESOURCES.TEAM, PERMISSION_ACTIONS.INVITE);
        const headersList = await getHeaders();
        return await auth.api.cancelInvitation({
          headers: headersList,
          body: {
            invitationId: params.invitationId,
          },
        });
      },
      { invitationId: params.invitationId }
    );
  },

  /**
   * Reject an invitation
   */
  async rejectInvitation(params: {
    invitationId: string;
  }) {
    return withErrorHandling(
      "rejectInvitation",
      async () => {
        const headersList = await getHeaders();
        return await auth.api.rejectInvitation({
          headers: headersList,
          body: {
            invitationId: params.invitationId,
          },
        });
      },
      { invitationId: params.invitationId }
    );
  },

  /**
   * Get an invitation by ID
   */
  async getInvitation(params: {
    id: string;
  }) {
    return withErrorHandling(
      "getInvitation",
      async () => {
        const headersList = await getHeaders();
        return await auth.api.getInvitation({
          headers: headersList,
          query: {
            id: params.id,
          },
        });
      },
      { id: params.id }
    );
  },

  /**
   * List invitations
   */
  async listInvitations(params?: {
    organizationId?: string;
  }) {
    return withErrorHandling(
      "listInvitations",
      async () => {
        const headersList = await getHeaders();
        return await auth.api.listInvitations({
          headers: headersList,
          query: params || {},
        });
      },
      params
    );
  },
};

