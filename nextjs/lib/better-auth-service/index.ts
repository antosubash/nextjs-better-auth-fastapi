/**
 * Better Auth Service
 *
 * Centralized service for all Better Auth API calls with:
 * - Automatic header handling
 * - Error handling
 * - Structured logging
 * - Permission checking
 */

export { adminService } from "./admin";
export { apiKeyService } from "./api-key";
export { emailPasswordService } from "./email-password";
export { organizationService } from "./organization";
export { sessionService } from "./session";
export type { OrganizationRoleAPI } from "./utils";

import { adminService } from "./admin";
import { apiKeyService } from "./api-key";
import { emailPasswordService } from "./email-password";
import { organizationService } from "./organization";
import { sessionService } from "./session";

/**
 * Main Better Auth Service
 * Export all services as a single object
 */
export const betterAuthService = {
  session: sessionService,
  apiKey: apiKeyService,
  organization: organizationService,
  emailPassword: emailPasswordService,
  admin: adminService,
};

export default betterAuthService;
