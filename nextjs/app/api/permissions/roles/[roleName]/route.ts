import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { USER_ROLES } from "@/lib/constants";
import { updateRolePermissions, getAllRoles, Permission } from "@/lib/permissions-utils";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ roleName: string }> }
) {
  try {
    const headersList = await headers();
    const sessionData = await auth.api.getSession({
      headers: headersList,
    });

    if (!sessionData?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const currentUser = sessionData.user;

    if (currentUser.role !== USER_ROLES.ADMIN) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const { roleName } = await params;
    const body = await request.json();
    const { permissions } = body as { permissions: Permission[] };

    if (!permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: "Invalid request body. Permissions array is required." },
        { status: 400 }
      );
    }

    updateRolePermissions(roleName, permissions);
    const roles = getAllRoles();
    const updatedRole = roles.find((r) => r.name === roleName);

    if (!updatedRole) {
      return NextResponse.json(
        { error: "Role not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ role: updatedRole });
  } catch (error) {
    console.error("Failed to update role permissions:", error);
    return NextResponse.json(
      { error: "Failed to update role permissions" },
      { status: 500 }
    );
  }
}

