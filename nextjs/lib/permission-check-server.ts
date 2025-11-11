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

