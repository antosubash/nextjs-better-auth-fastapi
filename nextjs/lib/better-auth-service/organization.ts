import { organizationCoreService } from "./organization-core";
import { organizationInvitationService } from "./organization-invitations";
import { organizationMemberService } from "./organization-members";
import { organizationRoleService } from "./organization-roles";

/**
 * Organization-related methods
 * Combines all organization sub-services into a single service
 */
export const organizationService = {
  ...organizationCoreService,
  ...organizationInvitationService,
  ...organizationMemberService,
  ...organizationRoleService,
};
