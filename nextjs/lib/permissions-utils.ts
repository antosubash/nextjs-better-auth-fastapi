
export interface Permission {
  resource: string;
  action: string;
  key: string;
}

export interface RoleInfo {
  name: string;
  permissions: Permission[];
}

// In-memory store for role permissions (can be replaced with database later)
const rolePermissionsStore: Record<string, Record<string, string[]>> = {
  user: {},
  member: { project: ["create"] },
  admin: { project: ["create", "update"] },
  owner: { project: ["create", "update", "delete"] },
  myCustomRole: {
    project: ["create", "update", "delete"],
    organization: ["update"],
  },
};

export function getAllPermissions(): Permission[] {
  const statement = {
    project: ["create", "share", "update", "delete"],
    organization: ["create", "update", "delete"],
  } as const;

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
  const rolePermissions = rolePermissionsStore[roleName] || {};

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

export function getUserEffectivePermissions(userRole: string | null | undefined): Permission[] {
  if (!userRole) {
    return [];
  }

  return getRolePermissions(userRole);
}

export function formatPermissionKey(resource: string, action: string): string {
  return `${resource}:${action}`;
}

export function getAllRoles(): RoleInfo[] {
  return Object.entries(rolePermissionsStore).map(([name, rolePermissions]) => {
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
  const rolePermissions: Record<string, string[]> = {};

  for (const permission of permissions) {
    if (!rolePermissions[permission.resource]) {
      rolePermissions[permission.resource] = [];
    }
    rolePermissions[permission.resource].push(permission.action);
  }

  rolePermissionsStore[roleName] = rolePermissions;
}

export function getRolePermissionsFromStore(roleName: string): Record<string, string[]> {
  return rolePermissionsStore[roleName] || {};
}

