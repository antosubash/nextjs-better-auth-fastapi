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
        { error: PERMISSION_ERRORS.UNAUTHORIZED },
        { status: 401 }
      );
    }

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

    // For other users, use Better Auth admin API to fetch user data
    // This requires admin permissions which are checked by requirePermission above
    try {
      const userListResult = await auth.api.listUsers({
        headers: headersList,
        query: {
          limit: "1000",
          offset: "0",
        },
      });

      if (userListResult.error) {
        return NextResponse.json(
          { error: PERMISSION_ERRORS.LOAD_USER_PERMISSIONS_FAILED },
          { status: 500 }
        );
      }

      const users = (userListResult.data as { users?: Array<{ id: string; name: string; email: string; role?: string | null }> })?.users || [];
      const targetUser = users.find((u) => u.id === targetUserId);

      if (!targetUser) {
        return NextResponse.json(
          { error: "User not found" },
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

