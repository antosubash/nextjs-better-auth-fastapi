import { Permission, RoleInfo } from "./permissions-utils";

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
    throw new Error("Failed to fetch permissions");
  }

  const data = await response.json();
  return data.permissions || [];
}

export async function getRoles(): Promise<RoleInfo[]> {
  const response = await fetch("/api/permissions/roles");
  
  if (!response.ok) {
    throw new Error("Failed to fetch roles");
  }

  const data = await response.json();
  return data.roles || [];
}

export async function getUserPermissions(userId: string): Promise<UserPermissionsResponse> {
  const response = await fetch(`/api/permissions/users/${userId}`);
  
  if (!response.ok) {
    throw new Error("Failed to fetch user permissions");
  }

  return response.json();
}

