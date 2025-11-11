import { headers } from "next/headers";
import { auth } from "../auth";
import { checkUserPermission } from "../permission-check";
import { PERMISSION_ERRORS } from "../constants";

/**
 * Server-only utilities for Better Auth Service
 * These functions can only be used in Server Components or Server Actions
 * WARNING: Do not import this file in Client Components
 */

export async function getHeaders() {
  return await headers();
}

/**
 * Check if the current user has the required permission
 * Throws an error if permission is denied
 * Server-only function
 */
export async function requirePermission(
  resource: string,
  action: string
): Promise<void> {
  const headersList = await getHeaders();
  const sessionData = await auth.api.getSession({ headers: headersList });

  const userId = sessionData?.user?.id;
  const userRole = sessionData?.user?.role;

  if (!userId || !userRole) {
    throw new Error(PERMISSION_ERRORS.UNAUTHORIZED);
  }

  const result = checkUserPermission(userId, userRole, resource, action);

  if (!result.hasPermission) {
    throw new Error(result.error || PERMISSION_ERRORS.INSUFFICIENT_PERMISSIONS);
  }
}

