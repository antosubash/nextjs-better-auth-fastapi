import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { PERMISSION_ACTIONS, PERMISSION_RESOURCES, ROLE_MANAGEMENT_ERRORS } from "@/lib/constants";
import { requirePermission } from "@/lib/permission-check-server";
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
      return NextResponse.json({ error: ROLE_MANAGEMENT_ERRORS.ROLE_NOT_FOUND }, { status: 404 });
    }

    return NextResponse.json({ role });
  } catch (error) {
    console.error("Failed to fetch role:", error);
    return NextResponse.json({ error: ROLE_MANAGEMENT_ERRORS.ROLE_NOT_FOUND }, { status: 500 });
  }
}
