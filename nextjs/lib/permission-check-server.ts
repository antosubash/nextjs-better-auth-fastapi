import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { betterAuthService } from "./better-auth-service/index";
import { ADMIN_ERRORS, PERMISSION_ERRORS, USER_ROLES } from "./constants";
import { checkPermission } from "./permission-check";

/**
 * Server-only permission checking utilities for API routes
 * WARNING: Do not import this file in Client Components
 */

const DEBUG_PERMISSIONS = process.env.DEBUG_PERMISSIONS === "true";

function debugLog(...args: unknown[]): void {
  if (DEBUG_PERMISSIONS) {
    console.log(...args);
  }
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
  debugLog(`[requirePermission] Checking permission: ${resource}.${action}`);

  const sessionData = await betterAuthService.session.getSession();

  const userId = sessionData?.user?.id;
  const userRole = sessionData?.user?.role;

  debugLog("[requirePermission] Session data:", {
    userId,
    userRole,
    hasApiKeyPermissions: !!apiKeyPermissions,
  });

  // If no session and no API key permissions, deny access
  if (!userId && !apiKeyPermissions) {
    debugLog("[requirePermission] Access denied: No session and no API key permissions");
    return NextResponse.json({ error: PERMISSION_ERRORS.UNAUTHORIZED }, { status: 401 });
  }

  const result = checkPermission(userId, userRole, apiKeyPermissions || null, resource, action);

  debugLog(`[requirePermission] Permission check result:`, {
    hasPermission: result.hasPermission,
    error: result.error,
    resource,
    action,
  });

  if (!result.hasPermission) {
    debugLog(
      `[requirePermission] Access denied: ${result.error || PERMISSION_ERRORS.INSUFFICIENT_PERMISSIONS}`
    );
    return NextResponse.json(
      { error: result.error || PERMISSION_ERRORS.INSUFFICIENT_PERMISSIONS },
      { status: 403 }
    );
  }

  debugLog(`[requirePermission] Access granted: ${resource}.${action}`);
  return null; // Permission granted
}

/**
 * Require any of the specified permissions for an API route
 */
export async function requireAnyPermission(
  permissions: Array<{ resource: string; action: string }>,
  apiKeyPermissions?: Record<string, string[]> | null
): Promise<NextResponse | null> {
  debugLog(`[requireAnyPermission] Checking ${permissions.length} permissions:`, permissions);

  const sessionData = await betterAuthService.session.getSession();

  const userId = sessionData?.user?.id;
  const userRole = sessionData?.user?.role;

  debugLog("[requireAnyPermission] Session data:", {
    userId,
    userRole,
    hasApiKeyPermissions: !!apiKeyPermissions,
  });

  // If no session and no API key permissions, deny access
  if (!userId && !apiKeyPermissions) {
    debugLog("[requireAnyPermission] Access denied: No session and no API key permissions");
    return NextResponse.json({ error: PERMISSION_ERRORS.UNAUTHORIZED }, { status: 401 });
  }

  // Check each permission until one is found
  for (const { resource, action } of permissions) {
    debugLog(`[requireAnyPermission] Checking permission: ${resource}.${action}`);

    const result = checkPermission(userId, userRole, apiKeyPermissions || null, resource, action);

    debugLog(`[requireAnyPermission] Permission check result for ${resource}.${action}:`, {
      hasPermission: result.hasPermission,
      error: result.error,
    });

    if (result.hasPermission) {
      debugLog(`[requireAnyPermission] Access granted: ${resource}.${action}`);
      return null; // At least one permission granted
    }
  }

  // No permissions matched
  debugLog("[requireAnyPermission] Access denied: No matching permissions found");
  return NextResponse.json({ error: PERMISSION_ERRORS.INSUFFICIENT_PERMISSIONS }, { status: 403 });
}

/**
 * Require all of the specified permissions for an API route
 */
export async function requireAllPermissions(
  permissions: Array<{ resource: string; action: string }>,
  apiKeyPermissions?: Record<string, string[]> | null
): Promise<NextResponse | null> {
  debugLog(`[requireAllPermissions] Checking ${permissions.length} permissions:`, permissions);

  const sessionData = await betterAuthService.session.getSession();

  const userId = sessionData?.user?.id;
  const userRole = sessionData?.user?.role;

  debugLog("[requireAllPermissions] Session data:", {
    userId,
    userRole,
    hasApiKeyPermissions: !!apiKeyPermissions,
  });

  // If no session and no API key permissions, deny access
  if (!userId && !apiKeyPermissions) {
    debugLog("[requireAllPermissions] Access denied: No session and no API key permissions");
    return NextResponse.json({ error: PERMISSION_ERRORS.UNAUTHORIZED }, { status: 401 });
  }

  // Check all permissions
  for (const { resource, action } of permissions) {
    debugLog(`[requireAllPermissions] Checking permission: ${resource}.${action}`);

    const result = checkPermission(userId, userRole, apiKeyPermissions || null, resource, action);

    debugLog(`[requireAllPermissions] Permission check result for ${resource}.${action}:`, {
      hasPermission: result.hasPermission,
      error: result.error,
    });

    if (!result.hasPermission) {
      debugLog(
        `[requireAllPermissions] Access denied: Missing permission ${resource}.${action} - ${result.error || PERMISSION_ERRORS.INSUFFICIENT_PERMISSIONS}`
      );
      return NextResponse.json(
        { error: result.error || PERMISSION_ERRORS.INSUFFICIENT_PERMISSIONS },
        { status: 403 }
      );
    }
  }

  debugLog("[requireAllPermissions] Access granted: All permissions satisfied");
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
  debugLog("[requireAdmin] Checking admin access");

  const headersList = await headers();
  const sessionData = await betterAuthService.session.getSession();

  debugLog("[requireAdmin] Session data:", {
    userId: sessionData?.user?.id,
    userRole: sessionData?.user?.role,
    hasSession: !!sessionData,
  });

  if (!sessionData?.user?.id) {
    debugLog("[requireAdmin] Access denied: No session found");
    return NextResponse.json({ error: ADMIN_ERRORS.ACCESS_DENIED }, { status: 401 });
  }

  if (sessionData.user.role !== USER_ROLES.ADMIN) {
    debugLog(`[requireAdmin] Access denied: User role '${sessionData.user.role}' is not admin`);
    return NextResponse.json({ error: ADMIN_ERRORS.ACCESS_DENIED }, { status: 403 });
  }

  debugLog(`[requireAdmin] Access granted: User ${sessionData.user.id} is admin`);
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
  debugLog("[requireAuth] Checking authentication");

  const headersList = await headers();
  const sessionData = await betterAuthService.session.getSession();

  debugLog("[requireAuth] Session data:", {
    userId: sessionData?.user?.id,
    userRole: sessionData?.user?.role,
    hasSession: !!sessionData,
  });

  if (!sessionData?.user?.id) {
    debugLog("[requireAuth] Access denied: No authenticated user found");
    return NextResponse.json({ error: PERMISSION_ERRORS.UNAUTHORIZED }, { status: 401 });
  }

  debugLog(`[requireAuth] Access granted: User ${sessionData.user.id} is authenticated`);
  return { session: sessionData, headers: headersList };
}
