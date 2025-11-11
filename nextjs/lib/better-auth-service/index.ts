/**
 * Better Auth Service
 * 
 * Centralized service for all Better Auth API calls with:
 * - Automatic header handling
 * - Error handling
 * - Structured logging
 * - Permission checking
 */

export { sessionService } from "./session";
export { apiKeyService } from "./api-key";
export { organizationService } from "./organization";
export { emailPasswordService } from "./email-password";
export { adminService } from "./admin";
export type { OrganizationRoleAPI } from "./utils";

import { sessionService } from "./session";
import { apiKeyService } from "./api-key";
import { organizationService } from "./organization";
import { emailPasswordService } from "./email-password";
import { adminService } from "./admin";

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

