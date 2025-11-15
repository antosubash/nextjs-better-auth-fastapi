import { PERMISSION_ERRORS, ROLE_MANAGEMENT_ERRORS } from "./constants";
import type { Permission, RoleInfo } from "./permissions-utils";
import { getAssignableUserRoles as getAssignableRoles } from "./utils/role-validation";

export interface UserPermissionsResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string | null;
  };
  permissions: Permission[];
}

export async function getPermissions(): Promise<Permission[]> {
  const response = await fetch("/api/permissions");

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || PERMISSION_ERRORS.LOAD_PERMISSIONS_FAILED);
  }

  const data = await response.json();
  return data.permissions || [];
}

export async function getRoles(): Promise<RoleInfo[]> {
  const response = await fetch("/api/permissions/roles");

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || PERMISSION_ERRORS.LOAD_ROLES_FAILED);
  }

  const data = await response.json();
  return data.roles || [];
}

/**
 * Get only assignable user roles (filters out organization roles and default role)
 * Use this for user management interfaces
 */
export async function getAssignableUserRoles(): Promise<RoleInfo[]> {
  const allRoles = await getRoles();
  const assignableRoles = getAssignableRoles();
  const assignableRoleNames = new Set(assignableRoles.map((r) => r.name));
  return allRoles.filter((role) => assignableRoleNames.has(role.name));
}

export async function getRole(roleName: string): Promise<RoleInfo> {
  const response = await fetch(`/api/permissions/roles/${roleName}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || ROLE_MANAGEMENT_ERRORS.ROLE_NOT_FOUND);
  }

  const data = await response.json();
  return data.role;
}

export async function getUserPermissions(userId: string): Promise<UserPermissionsResponse> {
  const response = await fetch(`/api/permissions/users/${userId}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || PERMISSION_ERRORS.LOAD_USER_PERMISSIONS_FAILED);
  }

  return response.json();
}
