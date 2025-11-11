import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permission-check";
import { PERMISSION_ERRORS, PERMISSION_RESOURCES, PERMISSION_ACTIONS } from "@/lib/constants";
import { getAllPermissions } from "@/lib/permissions-utils";

export async function GET(_request: NextRequest) {
  try {
    const permissionError = await requirePermission(
      PERMISSION_RESOURCES.ROLE,
      PERMISSION_ACTIONS.READ
    );

    if (permissionError) {
      return permissionError;
    }

    const permissions = getAllPermissions();

    return NextResponse.json({ permissions });
  } catch (error) {
    console.error("Failed to fetch permissions:", error);
    return NextResponse.json(
      { error: PERMISSION_ERRORS.LOAD_PERMISSIONS_FAILED },
      { status: 500 }
    );
  }
}

