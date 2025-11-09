import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { requirePermission } from "@/lib/permission-check";
import { auth } from "@/lib/auth";
import { PERMISSION_ERRORS } from "@/lib/constants";
import { getUserEffectivePermissions } from "@/lib/permissions-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const permissionError = await requirePermission(
      _request,
      "user",
      "read"
    );

    if (permissionError) {
      return permissionError;
    }

    const { userId } = await params;
    const headersList = await headers();

    // Get current session to verify permissions
    const sessionData = await auth.api.getSession({
      headers: headersList,
    });

    if (!sessionData?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Use Better Auth API to get user data
    // Note: Better Auth getUser returns current user, so we need to use listUsers or check organization members
    // For now, we'll get the user role from the session or use Better Auth's admin API if available
    // Since Better Auth doesn't have a direct getUser by ID API, we'll need to use organization members API
    // or check if the user is in the same organization
    
    // For simplicity, if userId matches current user, use session data
    // Otherwise, we'd need to check organization membership via Better Auth APIs
    const targetUserId = userId;
    const currentUser = sessionData.user;
    
    // If requesting own permissions, use session data
    if (targetUserId === currentUser.id) {
      const permissions = getUserEffectivePermissions(currentUser.role || null);
      
      return NextResponse.json({
        user: {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role || null,
        },
        permissions,
      });
    }

    // For other users, we'd need to use Better Auth organization/member APIs
    // This is a simplified version - in production, you'd check organization membership
    return NextResponse.json(
      { error: "User not found or access denied" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Failed to fetch user permissions:", error);
    return NextResponse.json(
      { error: PERMISSION_ERRORS.LOAD_USER_PERMISSIONS_FAILED },
      { status: 500 }
    );
  }
}

