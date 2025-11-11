import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permission-check";
import { PERMISSION_ERRORS, ROLE_MANAGEMENT_ERRORS, PERMISSION_RESOURCES, PERMISSION_ACTIONS } from "@/lib/constants";
import { updateRolePermissions, getAllRoles, Permission } from "@/lib/permissions-utils";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ roleName: string }> }
) {
  try {
    const permissionError = await requirePermission(
      PERMISSION_RESOURCES.ROLE,
      PERMISSION_ACTIONS.UPDATE
    );

    if (permissionError) {
      return permissionError;
    }

    const { roleName } = await params;
    const body = await request.json();
    const { permissions } = body as { permissions: Permission[] };

    if (!permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: ROLE_MANAGEMENT_ERRORS.INVALID_REQUEST_BODY },
        { status: 400 }
      );
    }

    updateRolePermissions(roleName, permissions);
    const roles = getAllRoles();
    const updatedRole = roles.find((r) => r.name === roleName);

    if (!updatedRole) {
      return NextResponse.json(
        { error: ROLE_MANAGEMENT_ERRORS.ROLE_NOT_FOUND },
        { status: 404 }
      );
    }

    return NextResponse.json({ role: updatedRole });
  } catch (error) {
    console.error("Failed to update role permissions:", error);
    return NextResponse.json(
      { error: PERMISSION_ERRORS.UPDATE_ROLE_PERMISSIONS_FAILED },
      { status: 500 }
    );
  }
}

