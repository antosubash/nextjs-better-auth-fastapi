import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { PERMISSION_ACTIONS, PERMISSION_ERRORS, PERMISSION_RESOURCES } from "@/lib/constants";
import { requirePermission } from "@/lib/permission-check-server";
import { getAllRoles } from "@/lib/permissions-utils";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  try {
    const permissionError = await requirePermission(
      PERMISSION_RESOURCES.ROLE,
      PERMISSION_ACTIONS.READ
    );

    if (permissionError) {
      return permissionError;
    }

    const roles = getAllRoles();

    return NextResponse.json({ roles });
  } catch (error) {
    console.error("Failed to fetch roles:", error);
    return NextResponse.json({ error: PERMISSION_ERRORS.LOAD_ROLES_FAILED }, { status: 500 });
  }
}
