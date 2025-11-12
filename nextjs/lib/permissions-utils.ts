import { statement } from "./permissions";
import { PERMISSION_RESOURCES, PERMISSION_ACTIONS, ROLE_DISPLAY_NAMES, ROLE_DESCRIPTIONS } from "./constants";

export interface Permission {
  resource: string;
  action: string;
  key: string;
}

export interface RoleInfo {
  name: string;
  permissions: Permission[];
  displayName?: string;
  description?: string;
  isSystemRole?: boolean;
  isDeletable?: boolean;
  isEditable?: boolean;
}

/**
 * System roles that are built-in and cannot be deleted
 */
const SYSTEM_ROLES = new Set([
  "user",
  "admin",
  "member",
  "owner",
]);

/**
 * Format permission key from resource and action
 */
export function formatPermissionKey(resource: string, action: string): string {
  return `${resource}:${action}`;
}

/**
 * Convert role definition to permissions array
 */
function roleDefinitionToPermissions(
  rolePermissions: Record<string, readonly string[]>
): Permission[] {
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

/**
 * Check if a role is a system role
 */
function isSystemRole(roleName: string): boolean {
  return SYSTEM_ROLES.has(roleName.toLowerCase());
}

/**
 * Check if a role can be deleted
 */
function isRoleDeletable(roleName: string): boolean {
  return !isSystemRole(roleName);
}

/**
 * Check if a role can be edited
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isRoleEditable(_roleName: string): boolean {
  // System roles can be edited, but with caution
  // For now, allow editing all roles
  return true;
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
  member: { [PERMISSION_RESOURCES.PROJECT]: [PERMISSION_ACTIONS.CREATE] },
  admin: getAllPermissionsFromStatement(),
  owner: {
    [PERMISSION_RESOURCES.PROJECT]: [
      PERMISSION_ACTIONS.CREATE,
      PERMISSION_ACTIONS.UPDATE,
      PERMISSION_ACTIONS.DELETE,
    ],
    [PERMISSION_RESOURCES.ROLE]: [PERMISSION_ACTIONS.READ],
  },
  myCustomRole: {
    [PERMISSION_RESOURCES.PROJECT]: [
      PERMISSION_ACTIONS.CREATE,
      PERMISSION_ACTIONS.UPDATE,
      PERMISSION_ACTIONS.DELETE,
    ],
    [PERMISSION_RESOURCES.ORGANIZATION]: [PERMISSION_ACTIONS.UPDATE],
  },
  moderator: {
    [PERMISSION_RESOURCES.PROJECT]: [
      PERMISSION_ACTIONS.READ,
      PERMISSION_ACTIONS.LIST,
      PERMISSION_ACTIONS.VIEW,
      PERMISSION_ACTIONS.UPDATE,
      PERMISSION_ACTIONS.DELETE,
    ],
    [PERMISSION_RESOURCES.ORGANIZATION]: [
      PERMISSION_ACTIONS.READ,
      PERMISSION_ACTIONS.LIST,
      PERMISSION_ACTIONS.VIEW,
      PERMISSION_ACTIONS.UPDATE,
      PERMISSION_ACTIONS.REMOVE,
    ],
    [PERMISSION_RESOURCES.USER]: [
      PERMISSION_ACTIONS.READ,
      PERMISSION_ACTIONS.LIST,
      PERMISSION_ACTIONS.VIEW,
      PERMISSION_ACTIONS.UPDATE,
    ],
    [PERMISSION_RESOURCES.FILE]: [
      PERMISSION_ACTIONS.READ,
      PERMISSION_ACTIONS.LIST,
      PERMISSION_ACTIONS.VIEW,
      PERMISSION_ACTIONS.UPDATE,
      PERMISSION_ACTIONS.DELETE,
      PERMISSION_ACTIONS.DOWNLOAD,
    ],
    [PERMISSION_RESOURCES.SETTINGS]: [PERMISSION_ACTIONS.READ],
  },
  editor: {
    [PERMISSION_RESOURCES.PROJECT]: [
      PERMISSION_ACTIONS.READ,
      PERMISSION_ACTIONS.LIST,
      PERMISSION_ACTIONS.VIEW,
      PERMISSION_ACTIONS.CREATE,
      PERMISSION_ACTIONS.SHARE,
      PERMISSION_ACTIONS.UPDATE,
    ],
    [PERMISSION_RESOURCES.ORGANIZATION]: [
      PERMISSION_ACTIONS.READ,
      PERMISSION_ACTIONS.LIST,
      PERMISSION_ACTIONS.VIEW,
      PERMISSION_ACTIONS.CREATE,
      PERMISSION_ACTIONS.UPDATE,
      PERMISSION_ACTIONS.INVITE,
    ],
    [PERMISSION_RESOURCES.FILE]: [
      PERMISSION_ACTIONS.READ,
      PERMISSION_ACTIONS.LIST,
      PERMISSION_ACTIONS.VIEW,
      PERMISSION_ACTIONS.CREATE,
      PERMISSION_ACTIONS.UPDATE,
      PERMISSION_ACTIONS.UPLOAD,
      PERMISSION_ACTIONS.DOWNLOAD,
    ],
    [PERMISSION_RESOURCES.SETTINGS]: [PERMISSION_ACTIONS.READ],
  },
  viewer: {
    [PERMISSION_RESOURCES.PROJECT]: [
      PERMISSION_ACTIONS.READ,
      PERMISSION_ACTIONS.LIST,
      PERMISSION_ACTIONS.VIEW,
    ],
    [PERMISSION_RESOURCES.ORGANIZATION]: [
      PERMISSION_ACTIONS.READ,
      PERMISSION_ACTIONS.LIST,
      PERMISSION_ACTIONS.VIEW,
    ],
    [PERMISSION_RESOURCES.USER]: [
      PERMISSION_ACTIONS.READ,
      PERMISSION_ACTIONS.LIST,
      PERMISSION_ACTIONS.VIEW,
    ],
    [PERMISSION_RESOURCES.FILE]: [
      PERMISSION_ACTIONS.READ,
      PERMISSION_ACTIONS.LIST,
      PERMISSION_ACTIONS.VIEW,
      PERMISSION_ACTIONS.DOWNLOAD,
    ],
    [PERMISSION_RESOURCES.SETTINGS]: [PERMISSION_ACTIONS.READ],
  },
  support: {
    [PERMISSION_RESOURCES.USER]: [
      PERMISSION_ACTIONS.READ,
      PERMISSION_ACTIONS.LIST,
      PERMISSION_ACTIONS.VIEW,
      PERMISSION_ACTIONS.UPDATE,
    ],
    [PERMISSION_RESOURCES.ORGANIZATION]: [
      PERMISSION_ACTIONS.READ,
      PERMISSION_ACTIONS.LIST,
      PERMISSION_ACTIONS.VIEW,
      PERMISSION_ACTIONS.UPDATE,
    ],
    [PERMISSION_RESOURCES.SETTINGS]: [
      PERMISSION_ACTIONS.READ,
      PERMISSION_ACTIONS.UPDATE,
    ],
  },
};

export function getAllPermissions(): Permission[] {
  return roleDefinitionToPermissions(statement);
}

export function getRolePermissions(roleName: string): Permission[] {
  const rolePermissions = roleDefinitions[roleName] || {};
  return roleDefinitionToPermissions(rolePermissions);
}

export function getUserEffectivePermissions(
  userRole: string | null | undefined
): Permission[] {
  if (!userRole) {
    return [];
  }

  return getRolePermissions(userRole);
}

export function getAllRoles(): RoleInfo[] {
  return Object.entries(roleDefinitions).map(([name, rolePermissions]) => {
    const permissions = roleDefinitionToPermissions(rolePermissions);
    const displayName = ROLE_DISPLAY_NAMES[name as keyof typeof ROLE_DISPLAY_NAMES];
    const description = ROLE_DESCRIPTIONS[name as keyof typeof ROLE_DESCRIPTIONS];

    return {
      name,
      permissions,
      displayName,
      description,
      isSystemRole: isSystemRole(name),
      isDeletable: isRoleDeletable(name),
      isEditable: isRoleEditable(name),
    };
  });
}

export function getRole(roleName: string): RoleInfo | null {
  const rolePermissions = roleDefinitions[roleName];
  if (!rolePermissions) {
    return null;
  }

  const permissions = roleDefinitionToPermissions(rolePermissions);
  const displayName = ROLE_DISPLAY_NAMES[roleName as keyof typeof ROLE_DISPLAY_NAMES];
  const description = ROLE_DESCRIPTIONS[roleName as keyof typeof ROLE_DESCRIPTIONS];

  return {
    name: roleName,
    permissions,
    displayName,
    description,
    isSystemRole: isSystemRole(roleName),
    isDeletable: isRoleDeletable(roleName),
    isEditable: isRoleEditable(roleName),
  };
}


export function getRolePermissionsFromStore(
  roleName: string
): Record<string, string[]> {
  return roleDefinitions[roleName] || {};
}

export function roleExists(roleName: string): boolean {
  return roleName in roleDefinitions;
}

