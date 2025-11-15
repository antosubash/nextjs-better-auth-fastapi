import { USER_ROLES } from "../constants";
import type { RoleInfo } from "../permissions-utils";
import { getAllRoles } from "../permissions-utils";

/**
 * Valid assignable user roles (as defined in Better Auth admin plugin)
 * These are the only roles that can be assigned to users via the admin interface
 */
const ASSIGNABLE_USER_ROLES = new Set([
  USER_ROLES.ADMIN,
  USER_ROLES.MY_CUSTOM_ROLE,
  USER_ROLES.MODERATOR,
  USER_ROLES.EDITOR,
  USER_ROLES.VIEWER,
  USER_ROLES.SUPPORT,
]);

/**
 * Get all available roles
 */
export function getAvailableRoles(): RoleInfo[] {
  return getAllRoles();
}

/**
 * Get only assignable user roles (filters out organization roles and default role)
 */
export function getAssignableUserRoles(): RoleInfo[] {
  return getAllRoles().filter((role) =>
    ASSIGNABLE_USER_ROLES.has(
      role.name as
        | typeof USER_ROLES.ADMIN
        | typeof USER_ROLES.MY_CUSTOM_ROLE
        | typeof USER_ROLES.MODERATOR
        | typeof USER_ROLES.EDITOR
        | typeof USER_ROLES.VIEWER
        | typeof USER_ROLES.SUPPORT
    )
  );
}

/**
 * Get role names as an array
 */
export function getAvailableRoleNames(): string[] {
  return getAllRoles().map((role) => role.name);
}

/**
 * Get assignable user role names as an array
 */
export function getAssignableUserRoleNames(): string[] {
  return getAssignableUserRoles().map((role) => role.name);
}

/**
 * Validate if a role name is valid
 */
export function isValidRole(roleName: string | null | undefined): boolean {
  if (!roleName) {
    return false;
  }
  const availableRoles = getAvailableRoleNames();
  return availableRoles.includes(roleName);
}

/**
 * Validate if a role name is assignable to users
 */
export function isAssignableUserRole(roleName: string | null | undefined): boolean {
  if (!roleName) {
    return false;
  }
  return ASSIGNABLE_USER_ROLES.has(
    roleName as
      | typeof USER_ROLES.ADMIN
      | typeof USER_ROLES.MY_CUSTOM_ROLE
      | typeof USER_ROLES.MODERATOR
      | typeof USER_ROLES.EDITOR
      | typeof USER_ROLES.VIEWER
      | typeof USER_ROLES.SUPPORT
  );
}

/**
 * Get a valid role, falling back to default if invalid
 */
export function getValidRole(
  roleName: string | null | undefined,
  defaultRole: string = USER_ROLES.USER
): string {
  if (isValidRole(roleName) && roleName) {
    return roleName;
  }
  return defaultRole;
}

/**
 * Get a valid assignable user role, falling back to default if invalid
 */
export function getValidAssignableRole(
  roleName: string | null | undefined,
  defaultRole: string = USER_ROLES.USER
): string {
  if (isAssignableUserRole(roleName) && roleName) {
    return roleName;
  }
  // If the role is not assignable, try to find a valid assignable role
  // Otherwise fall back to default
  return defaultRole;
}

/**
 * Check if a role is an admin role
 */
export function isAdminRole(roleName: string | null | undefined): boolean {
  return roleName === USER_ROLES.ADMIN;
}

/**
 * Check if a role can be banned
 * Admin roles cannot be banned
 */
export function canBanRole(roleName: string | null | undefined): boolean {
  return !isAdminRole(roleName);
}

/**
 * Find role info by name
 */
export function findRoleByName(roleName: string): RoleInfo | undefined {
  return getAllRoles().find((role) => role.name === roleName);
}
