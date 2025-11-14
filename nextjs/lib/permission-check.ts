import { getUserEffectivePermissions, formatPermissionKey } from "./permissions-utils";
import { PERMISSION_ERRORS, USER_ROLES } from "./constants";

/**
 * Client-safe permission checking utilities
 * These functions can be used in both Client and Server Components
 */

export interface PermissionCheckResult {
  hasPermission: boolean;
  error?: string;
}

/**
 * Check if a user has a specific permission based on their role
 */
export function checkUserPermission(
  userId: string | null | undefined,
  userRole: string | null | undefined,
  resource: string,
  action: string
): PermissionCheckResult {
  if (!userId || !userRole) {
    return {
      hasPermission: false,
      error: PERMISSION_ERRORS.UNAUTHORIZED,
    };
  }

  // Admin has all permissions
  if (userRole === USER_ROLES.ADMIN) {
    return {
      hasPermission: true,
    };
  }

  const permissions = getUserEffectivePermissions(userRole);
  const permissionKey = formatPermissionKey(resource, action);

  const hasPermission = permissions.some((p) => p.key === permissionKey);

  return {
    hasPermission,
    error: hasPermission ? undefined : PERMISSION_ERRORS.INSUFFICIENT_PERMISSIONS,
  };
}

/**
 * Check if an API key has a specific permission
 */
export function checkApiKeyPermission(
  apiKeyPermissions: Record<string, string[]> | null | undefined,
  resource: string,
  action: string
): PermissionCheckResult {
  if (!apiKeyPermissions) {
    return {
      hasPermission: false,
      error: PERMISSION_ERRORS.INSUFFICIENT_PERMISSIONS,
    };
  }

  const resourceActions = apiKeyPermissions[resource] || [];
  const hasPermission = resourceActions.includes(action);

  return {
    hasPermission,
    error: hasPermission ? undefined : PERMISSION_ERRORS.INSUFFICIENT_PERMISSIONS,
  };
}

/**
 * Check if a user or API key has a specific permission
 */
export function checkPermission(
  userId: string | null | undefined,
  userRole: string | null | undefined,
  apiKeyPermissions: Record<string, string[]> | null | undefined,
  resource: string,
  action: string
): PermissionCheckResult {
  // If API key permissions are provided, check those first
  if (apiKeyPermissions) {
    return checkApiKeyPermission(apiKeyPermissions, resource, action);
  }

  // Otherwise check user role permissions
  return checkUserPermission(userId, userRole, resource, action);
}
