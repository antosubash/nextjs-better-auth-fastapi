import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { betterAuthService } from "./better-auth-service/index";
import { checkPermission } from "./permission-check";
import { PERMISSION_ERRORS, USER_ROLES, ADMIN_ERRORS } from "./constants";

/**
 * Server-only permission checking utilities for API routes
 * WARNING: Do not import this file in Client Components
 */

/**
 * Require a specific permission for an API route
 * Returns a NextResponse with error if permission is missing, or null if allowed
 */
export async function requirePermission(
  resource: string,
  action: string,
  apiKeyPermissions?: Record<string, string[]> | null
): Promise<NextResponse | null> {
  console.log(`[requirePermission] Checking permission: ${resource}.${action}`);

  const sessionData = await betterAuthService.session.getSession();

  const userId = sessionData?.user?.id;
  const userRole = sessionData?.user?.role;

  console.log("[requirePermission] Session data:", {
    userId,
    userRole,
    hasApiKeyPermissions: !!apiKeyPermissions,
  });

  // If no session and no API key permissions, deny access
  if (!userId && !apiKeyPermissions) {
    console.log("[requirePermission] Access denied: No session and no API key permissions");
    return NextResponse.json({ error: PERMISSION_ERRORS.UNAUTHORIZED }, { status: 401 });
  }

  const result = checkPermission(userId, userRole, apiKeyPermissions || null, resource, action);

  console.log(`[requirePermission] Permission check result:`, {
    hasPermission: result.hasPermission,
    error: result.error,
    resource,
    action,
  });

  if (!result.hasPermission) {
    console.log(
      `[requirePermission] Access denied: ${result.error || PERMISSION_ERRORS.INSUFFICIENT_PERMISSIONS}`
    );
    return NextResponse.json(
      { error: result.error || PERMISSION_ERRORS.INSUFFICIENT_PERMISSIONS },
      { status: 403 }
    );
  }

  console.log(`[requirePermission] Access granted: ${resource}.${action}`);
  return null; // Permission granted
}

/**
 * Require any of the specified permissions for an API route
 */
export async function requireAnyPermission(
  permissions: Array<{ resource: string; action: string }>,
  apiKeyPermissions?: Record<string, string[]> | null
): Promise<NextResponse | null> {
  console.log(`[requireAnyPermission] Checking ${permissions.length} permissions:`, permissions);

  const sessionData = await betterAuthService.session.getSession();

  const userId = sessionData?.user?.id;
  const userRole = sessionData?.user?.role;

  console.log("[requireAnyPermission] Session data:", {
    userId,
    userRole,
    hasApiKeyPermissions: !!apiKeyPermissions,
  });

  // If no session and no API key permissions, deny access
  if (!userId && !apiKeyPermissions) {
    console.log("[requireAnyPermission] Access denied: No session and no API key permissions");
    return NextResponse.json({ error: PERMISSION_ERRORS.UNAUTHORIZED }, { status: 401 });
  }

  // Check each permission until one is found
  for (const { resource, action } of permissions) {
    console.log(`[requireAnyPermission] Checking permission: ${resource}.${action}`);

    const result = checkPermission(userId, userRole, apiKeyPermissions || null, resource, action);

    console.log(`[requireAnyPermission] Permission check result for ${resource}.${action}:`, {
      hasPermission: result.hasPermission,
      error: result.error,
    });

    if (result.hasPermission) {
      console.log(`[requireAnyPermission] Access granted: ${resource}.${action}`);
      return null; // At least one permission granted
    }
  }

  // No permissions matched
  console.log("[requireAnyPermission] Access denied: No matching permissions found");
  return NextResponse.json({ error: PERMISSION_ERRORS.INSUFFICIENT_PERMISSIONS }, { status: 403 });
}

/**
 * Require all of the specified permissions for an API route
 */
export async function requireAllPermissions(
  permissions: Array<{ resource: string; action: string }>,
  apiKeyPermissions?: Record<string, string[]> | null
): Promise<NextResponse | null> {
  console.log(`[requireAllPermissions] Checking ${permissions.length} permissions:`, permissions);

  const sessionData = await betterAuthService.session.getSession();

  const userId = sessionData?.user?.id;
  const userRole = sessionData?.user?.role;

  console.log("[requireAllPermissions] Session data:", {
    userId,
    userRole,
    hasApiKeyPermissions: !!apiKeyPermissions,
  });

  // If no session and no API key permissions, deny access
  if (!userId && !apiKeyPermissions) {
    console.log("[requireAllPermissions] Access denied: No session and no API key permissions");
    return NextResponse.json({ error: PERMISSION_ERRORS.UNAUTHORIZED }, { status: 401 });
  }

  // Check all permissions
  for (const { resource, action } of permissions) {
    console.log(`[requireAllPermissions] Checking permission: ${resource}.${action}`);

    const result = checkPermission(userId, userRole, apiKeyPermissions || null, resource, action);

    console.log(`[requireAllPermissions] Permission check result for ${resource}.${action}:`, {
      hasPermission: result.hasPermission,
      error: result.error,
    });

    if (!result.hasPermission) {
      console.log(
        `[requireAllPermissions] Access denied: Missing permission ${resource}.${action} - ${result.error || PERMISSION_ERRORS.INSUFFICIENT_PERMISSIONS}`
      );
      return NextResponse.json(
        { error: result.error || PERMISSION_ERRORS.INSUFFICIENT_PERMISSIONS },
        { status: 403 }
      );
    }
  }

  console.log("[requireAllPermissions] Access granted: All permissions satisfied");
  return null; // All permissions granted
}

/**
 * Require admin role for an API route
 * Returns a NextResponse with error if not admin, or session data and headers if allowed
 */
export async function requireAdmin(): Promise<
  | NextResponse
  | { session: Awaited<ReturnType<typeof betterAuthService.session.getSession>>; headers: Headers }
> {
  console.log("[requireAdmin] Checking admin access");

  const headersList = await headers();
  const sessionData = await betterAuthService.session.getSession();

  console.log("[requireAdmin] Session data:", {
    userId: sessionData?.user?.id,
    userRole: sessionData?.user?.role,
    hasSession: !!sessionData,
  });

  if (!sessionData?.user?.id) {
    console.log("[requireAdmin] Access denied: No session found");
    return NextResponse.json({ error: ADMIN_ERRORS.ACCESS_DENIED }, { status: 401 });
  }

  if (sessionData.user.role !== USER_ROLES.ADMIN) {
    console.log(`[requireAdmin] Access denied: User role '${sessionData.user.role}' is not admin`);
    return NextResponse.json({ error: ADMIN_ERRORS.ACCESS_DENIED }, { status: 403 });
  }

  console.log(`[requireAdmin] Access granted: User ${sessionData.user.id} is admin`);
  return { session: sessionData, headers: headersList };
}

/**
 * Require authentication for an API route
 * Returns a NextResponse with error if not authenticated, or session data and headers if allowed
 */
export async function requireAuth(): Promise<
  | NextResponse
  | { session: Awaited<ReturnType<typeof betterAuthService.session.getSession>>; headers: Headers }
> {
  console.log("[requireAuth] Checking authentication");

  const headersList = await headers();
  const sessionData = await betterAuthService.session.getSession();

  console.log("[requireAuth] Session data:", {
    userId: sessionData?.user?.id,
    userRole: sessionData?.user?.role,
    hasSession: !!sessionData,
  });

  if (!sessionData?.user?.id) {
    console.log("[requireAuth] Access denied: No authenticated user found");
    return NextResponse.json({ error: PERMISSION_ERRORS.UNAUTHORIZED }, { status: 401 });
  }

  console.log(`[requireAuth] Access granted: User ${sessionData.user.id} is authenticated`);
  return { session: sessionData, headers: headersList };
}
