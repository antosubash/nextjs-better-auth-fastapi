import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { betterAuthService } from "./better-auth-service/index";
import { getUserEffectivePermissions, formatPermissionKey } from "./permissions-utils";
import { PERMISSION_ERRORS, USER_ROLES, ADMIN_ERRORS } from "./constants";

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

/**
 * Require a specific permission for an API route
 * Returns a NextResponse with error if permission is missing, or null if allowed
 */
export async function requirePermission(
  resource: string,
  action: string,
  apiKeyPermissions?: Record<string, string[]> | null
): Promise<NextResponse | null> {
  const sessionData = await betterAuthService.session.getSession();

  const userId = sessionData?.user?.id;
  const userRole = sessionData?.user?.role;

  // If no session and no API key permissions, deny access
  if (!userId && !apiKeyPermissions) {
    return NextResponse.json(
      { error: PERMISSION_ERRORS.UNAUTHORIZED },
      { status: 401 }
    );
  }

  const result = checkPermission(
    userId,
    userRole,
    apiKeyPermissions || null,
    resource,
    action
  );

  if (!result.hasPermission) {
    return NextResponse.json(
      { error: result.error || PERMISSION_ERRORS.INSUFFICIENT_PERMISSIONS },
      { status: 403 }
    );
  }

  return null; // Permission granted
}

/**
 * Require any of the specified permissions for an API route
 */
export async function requireAnyPermission(
  permissions: Array<{ resource: string; action: string }>,
  apiKeyPermissions?: Record<string, string[]> | null
): Promise<NextResponse | null> {
  const sessionData = await betterAuthService.session.getSession();

  const userId = sessionData?.user?.id;
  const userRole = sessionData?.user?.role;

  // If no session and no API key permissions, deny access
  if (!userId && !apiKeyPermissions) {
    return NextResponse.json(
      { error: PERMISSION_ERRORS.UNAUTHORIZED },
      { status: 401 }
    );
  }

  // Check each permission until one is found
  for (const { resource, action } of permissions) {
    const result = checkPermission(
      userId,
      userRole,
      apiKeyPermissions || null,
      resource,
      action
    );

    if (result.hasPermission) {
      return null; // At least one permission granted
    }
  }

  // No permissions matched
  return NextResponse.json(
    { error: PERMISSION_ERRORS.INSUFFICIENT_PERMISSIONS },
    { status: 403 }
  );
}

/**
 * Require all of the specified permissions for an API route
 */
export async function requireAllPermissions(
  permissions: Array<{ resource: string; action: string }>,
  apiKeyPermissions?: Record<string, string[]> | null
): Promise<NextResponse | null> {
  const sessionData = await betterAuthService.session.getSession();

  const userId = sessionData?.user?.id;
  const userRole = sessionData?.user?.role;

  // If no session and no API key permissions, deny access
  if (!userId && !apiKeyPermissions) {
    return NextResponse.json(
      { error: PERMISSION_ERRORS.UNAUTHORIZED },
      { status: 401 }
    );
  }

  // Check all permissions
  for (const { resource, action } of permissions) {
    const result = checkPermission(
      userId,
      userRole,
      apiKeyPermissions || null,
      resource,
      action
    );

    if (!result.hasPermission) {
      return NextResponse.json(
        { error: result.error || PERMISSION_ERRORS.INSUFFICIENT_PERMISSIONS },
        { status: 403 }
      );
    }
  }

  return null; // All permissions granted
}

/**
 * Require admin role for an API route
 * Returns a NextResponse with error if not admin, or session data and headers if allowed
 */
export async function requireAdmin(): Promise<NextResponse | { session: Awaited<ReturnType<typeof betterAuthService.session.getSession>>; headers: Headers }> {
  const headersList = await headers();
  const sessionData = await betterAuthService.session.getSession();

  if (!sessionData?.user?.id) {
    return NextResponse.json(
      { error: ADMIN_ERRORS.ACCESS_DENIED },
      { status: 401 }
    );
  }

  if (sessionData.user.role !== USER_ROLES.ADMIN) {
    return NextResponse.json(
      { error: ADMIN_ERRORS.ACCESS_DENIED },
      { status: 403 }
    );
  }

  return { session: sessionData, headers: headersList };
}

/**
 * Require authentication for an API route
 * Returns a NextResponse with error if not authenticated, or session data and headers if allowed
 */
export async function requireAuth(): Promise<NextResponse | { session: Awaited<ReturnType<typeof betterAuthService.session.getSession>>; headers: Headers }> {
  const headersList = await headers();
  const sessionData = await betterAuthService.session.getSession();

  if (!sessionData?.user?.id) {
    return NextResponse.json(
      { error: PERMISSION_ERRORS.UNAUTHORIZED },
      { status: 401 }
    );
  }

  return { session: sessionData, headers: headersList };
}

