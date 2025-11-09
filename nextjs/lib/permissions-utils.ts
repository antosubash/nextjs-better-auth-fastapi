import { statement } from "./permissions";

export interface Permission {
  resource: string;
  action: string;
  key: string;
}

export interface RoleInfo {
  name: string;
  permissions: Permission[];
}

// Helper function to get all permissions from statement
function getAllPermissionsFromStatement(): Record<string, string[]> {
  const allPermissions: Record<string, string[]> = {};
  for (const [resource, actions] of Object.entries(statement)) {
    allPermissions[resource] = [...actions];
  }
  return allPermissions;
}

// Map of role names to Better Auth role definitions
// These match the roles defined in permissions.ts using accessControl.newRole()
const roleDefinitions: Record<string, Record<string, string[]>> = {
  user: {},
  member: { project: ["create"] },
  admin: getAllPermissionsFromStatement(),
  owner: { project: ["create", "update", "delete"], role: ["read"] },
  myCustomRole: {
    project: ["create", "update", "delete"],
    organization: ["update"],
  },
  moderator: {
    project: ["read", "list", "view", "update", "delete"],
    organization: ["read", "list", "view", "update"],
    user: ["read", "list", "view", "update"],
    team: ["read", "list", "view", "update", "remove"],
    file: ["read", "list", "view", "update", "delete", "download"],
    settings: ["read"],
  },
  editor: {
    project: ["read", "list", "view", "create", "share", "update"],
    organization: ["read", "list", "view", "update"],
    team: ["read", "list", "view", "create", "update", "invite"],
    file: ["read", "list", "view", "create", "update", "upload", "download"],
    settings: ["read"],
  },
  viewer: {
    project: ["read", "list", "view"],
    organization: ["read", "list", "view"],
    user: ["read", "list", "view"],
    team: ["read", "list", "view"],
    file: ["read", "list", "view", "download"],
    settings: ["read"],
  },
  support: {
    user: ["read", "list", "view", "update"],
    organization: ["read", "list", "view", "update"],
    team: ["read", "list", "view"],
    settings: ["read", "update"],
  },
};

export function getAllPermissions(): Permission[] {
  const permissions: Permission[] = [];

  for (const [resource, actions] of Object.entries(statement)) {
    for (const action of actions) {
      permissions.push({
        resource,
        action,
        key: formatPermissionKey(resource, action),
      });
    }
  }

  return permissions;
}

export function getRolePermissions(roleName: string): Permission[] {
  const rolePermissions = roleDefinitions[roleName] || {};
  const permissions: Permission[] = [];

  for (const [resource, actions] of Object.entries(rolePermissions)) {
    if (Array.isArray(actions)) {
      for (const action of actions) {
        permissions.push({
          resource,
          action,
          key: formatPermissionKey(resource, action),
        });
      }
    }
  }

  return permissions;
}

export function getUserEffectivePermissions(
  userRole: string | null | undefined
): Permission[] {
  if (!userRole) {
    return [];
  }

  return getRolePermissions(userRole);
}

export function formatPermissionKey(resource: string, action: string): string {
  return `${resource}:${action}`;
}

export function getAllRoles(): RoleInfo[] {
  return Object.entries(roleDefinitions).map(([name, rolePermissions]) => {
    const permissions: Permission[] = [];

    for (const [resource, actions] of Object.entries(rolePermissions)) {
      if (Array.isArray(actions)) {
        for (const action of actions) {
          permissions.push({
            resource,
            action,
            key: formatPermissionKey(resource, action),
          });
        }
      }
    }

    return {
      name,
      permissions,
    };
  });
}

export function updateRolePermissions(
  roleName: string,
  permissions: Permission[]
): void {
  // Convert permissions array to role definition format
  const rolePermissions: Record<string, string[]> = {};

  for (const permission of permissions) {
    if (!rolePermissions[permission.resource]) {
      rolePermissions[permission.resource] = [];
    }
    rolePermissions[permission.resource].push(permission.action);
  }

  // Update the role definition (in-memory only, as Better Auth roles are code-defined)
  roleDefinitions[roleName] = rolePermissions;
}

export function getRolePermissionsFromStore(
  roleName: string
): Record<string, string[]> {
  return roleDefinitions[roleName] || {};
}

