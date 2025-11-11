import { withErrorHandling } from "./utils";
import { getHeaders, requirePermission } from "./server-utils";
import { auth } from "../auth";
import { PERMISSION_RESOURCES, PERMISSION_ACTIONS } from "../constants";

/**
 * Core organization CRUD operations
 */
export const organizationCoreService = {
  /**
   * Create an organization
   */
  async createOrganization(params: {
    name: string;
    slug: string;
    logo?: string;
    metadata?: Record<string, unknown>;
    userId?: string;
    keepCurrentActiveOrganization?: boolean;
  }) {
    return withErrorHandling(
      "createOrganization",
      async () => {
        await requirePermission(PERMISSION_RESOURCES.ORGANIZATION, PERMISSION_ACTIONS.CREATE);
        const headersList = await getHeaders();
        return await auth.api.createOrganization({
          headers: headersList,
          body: {
            name: params.name,
            slug: params.slug,
            logo: params.logo,
            metadata: params.metadata,
            userId: params.userId,
            keepCurrentActiveOrganization: params.keepCurrentActiveOrganization,
          },
        });
      },
      { name: params.name, slug: params.slug }
    );
  },

  /**
   * Check if organization slug is available
   */
  async checkSlug(params: {
    slug: string;
  }) {
    return withErrorHandling(
      "checkSlug",
      async () => {
        return await auth.api.checkOrganizationSlug({
          body: {
            slug: params.slug,
          },
        });
      },
      { slug: params.slug }
    );
  },

  /**
   * Update an organization
   */
  async updateOrganization(params: {
    organizationId: string;
    data: Record<string, unknown>;
  }) {
    return withErrorHandling(
      "updateOrganization",
      async () => {
        await requirePermission(PERMISSION_RESOURCES.ORGANIZATION, PERMISSION_ACTIONS.UPDATE);
        const headersList = await getHeaders();
        return await auth.api.updateOrganization({
          headers: headersList,
          body: {
            organizationId: params.organizationId,
            data: params.data,
          },
        });
      },
      { organizationId: params.organizationId }
    );
  },

  /**
   * Delete an organization
   */
  async deleteOrganization(params: {
    organizationId: string;
  }) {
    return withErrorHandling(
      "deleteOrganization",
      async () => {
        await requirePermission(PERMISSION_RESOURCES.ORGANIZATION, PERMISSION_ACTIONS.DELETE);
        const headersList = await getHeaders();
        return await auth.api.deleteOrganization({
          headers: headersList,
          body: {
            organizationId: params.organizationId,
          },
        });
      },
      { organizationId: params.organizationId }
    );
  },

  /**
   * Set active organization
   */
  async setActiveOrganization(params: {
    organizationId: string;
  }) {
    return withErrorHandling(
      "setActiveOrganization",
      async () => {
        const headersList = await getHeaders();
        return await auth.api.setActiveOrganization({
          headers: headersList,
          body: {
            organizationId: params.organizationId,
          },
        });
      },
      { organizationId: params.organizationId }
    );
  },

  /**
   * Get active organization
   */
  async getActiveOrganization() {
    return withErrorHandling("getActiveOrganization", async () => {
      await requirePermission(PERMISSION_RESOURCES.ORGANIZATION, PERMISSION_ACTIONS.READ);
      const headersList = await getHeaders();
      // getActiveOrganization might not be available, using listOrganizations as fallback
      const orgs = await auth.api.listOrganizations({ headers: headersList });
      return orgs?.[0] || null;
    });
  },

  /**
   * List all organizations
   */
  async listOrganizations() {
    return withErrorHandling("listOrganizations", async () => {
      await requirePermission(PERMISSION_RESOURCES.ORGANIZATION, PERMISSION_ACTIONS.LIST);
      const headersList = await getHeaders();
      return await auth.api.listOrganizations({ headers: headersList });
    });
  },

  /**
   * Get a specific organization by ID
   */
  async getOrganization(id: string) {
    return withErrorHandling("getOrganization", async () => {
      await requirePermission(PERMISSION_RESOURCES.ORGANIZATION, PERMISSION_ACTIONS.READ);
      const headersList = await getHeaders();
      return await auth.api.getFullOrganization({ headers: headersList, query: { organizationId: id } });
    });
  },
};

