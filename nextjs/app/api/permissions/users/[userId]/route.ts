import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permission-check";
import { betterAuthService } from "@/lib/better-auth-service";
import { PERMISSION_ERRORS, STATS_ERRORS, PERMISSION_RESOURCES, PERMISSION_ACTIONS } from "@/lib/constants";
import { getUserEffectivePermissions } from "@/lib/permissions-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const permissionError = await requirePermission(
      PERMISSION_RESOURCES.USER,
      PERMISSION_ACTIONS.READ
    );

    if (permissionError) {
      return permissionError;
    }

    const { userId } = await params;

    // Get current session to verify permissions
    const sessionData = await betterAuthService.session.getSession();

    const targetUserId = userId;
    const currentUser = sessionData?.user;
    
    // If requesting own permissions, use session data
    if (currentUser && targetUserId === currentUser.id) {
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

    // For other users, use Better Auth admin API to fetch user data
    // This requires admin permissions which are checked by requirePermission above
    try {
      const userListResult = await betterAuthService.admin.listUsers({
        limit: "1000",
        offset: "0",
      });

      // Handle the result - it can be either success or error format
      if (!userListResult || ("error" in userListResult && userListResult.error)) {
        return NextResponse.json(
          { error: PERMISSION_ERRORS.LOAD_USER_PERMISSIONS_FAILED },
          { status: 500 }
        );
      }

      // Type guard to check if result has users array
      const users = ("users" in userListResult && Array.isArray(userListResult.users))
        ? userListResult.users
        : [];
      const targetUser = users.find((u) => u.id === targetUserId);

      if (!targetUser) {
        return NextResponse.json(
          { error: STATS_ERRORS.USER_NOT_FOUND },
          { status: 404 }
        );
      }

      const permissions = getUserEffectivePermissions(targetUser.role || null);

      return NextResponse.json({
        user: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
          role: targetUser.role || null,
        },
        permissions,
      });
    } catch (apiError) {
      console.error("Failed to fetch user via admin API:", apiError);
      return NextResponse.json(
        { error: PERMISSION_ERRORS.LOAD_USER_PERMISSIONS_FAILED },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Failed to fetch user permissions:", error);
    return NextResponse.json(
      { error: PERMISSION_ERRORS.LOAD_USER_PERMISSIONS_FAILED },
      { status: 500 }
    );
  }
}

