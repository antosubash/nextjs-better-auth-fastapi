
export interface Permission {
  resource: string;
  action: string;
  key: string;
}

export interface RoleInfo {
  name: string;
  permissions: Permission[];
}

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
  let rolePermissions: Record<string, string[]>;
  
  switch (roleName) {
    case "user":
      rolePermissions = {};
      break;
    case "member":
      rolePermissions = { project: ["create"] };
      break;
    case "admin":
      rolePermissions = { project: ["create", "update"] };
      break;
    case "owner":
      rolePermissions = { project: ["create", "update", "delete"] };
      break;
    case "myCustomRole":
      rolePermissions = {
        project: ["create", "update", "delete"],
        organization: ["update"],
      };
      break;
    default:
      return [];
  }

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
  const roles = [
    { name: "user", permissions: {} },
    { name: "member", permissions: { project: ["create"] } },
    { name: "admin", permissions: { project: ["create", "update"] } },
    { name: "owner", permissions: { project: ["create", "update", "delete"] } },
    {
      name: "myCustomRole",
      permissions: {
        project: ["create", "update", "delete"],
        organization: ["update"],
      },
    },
  ];

  return roles.map(({ name, permissions: rolePermissions }) => {
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

