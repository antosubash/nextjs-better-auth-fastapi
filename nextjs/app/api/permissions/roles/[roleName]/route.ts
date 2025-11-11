import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permission-check-server";
import {
  PERMISSION_RESOURCES,
  PERMISSION_ACTIONS,
  ROLE_MANAGEMENT_ERRORS,
} from "@/lib/constants";
import { getRole } from "@/lib/permissions-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ roleName: string }> }
) {
  try {
    const permissionError = await requirePermission(
      PERMISSION_RESOURCES.ROLE,
      PERMISSION_ACTIONS.READ
    );

    if (permissionError) {
      return permissionError;
    }

    const { roleName } = await params;
    const role = getRole(roleName);

    if (!role) {
      return NextResponse.json(
        { error: ROLE_MANAGEMENT_ERRORS.ROLE_NOT_FOUND },
        { status: 404 }
      );
    }

    return NextResponse.json({ role });
  } catch (error) {
    console.error("Failed to fetch role:", error);
    return NextResponse.json(
      { error: ROLE_MANAGEMENT_ERRORS.ROLE_NOT_FOUND },
      { status: 500 }
    );
  }
}

