import { NextRequest, NextResponse } from "next/server";
import { betterAuthService } from "@/lib/better-auth-service/index";
import { INVITATION_ERRORS, PERMISSION_RESOURCES, PERMISSION_ACTIONS } from "@/lib/constants";
import { requirePermission } from "@/lib/permission-check-server";

export async function POST(request: NextRequest) {
  try {
    const permissionError = await requirePermission(
      PERMISSION_RESOURCES.ORGANIZATION,
      PERMISSION_ACTIONS.INVITE
    );

    if (permissionError) {
      return permissionError;
    }

    const body = await request.json();
    const { organizationId, email, role } = body;

    if (!organizationId || !email || !role) {
      return NextResponse.json(
        { error: INVITATION_ERRORS.MISSING_FIELDS },
        { status: 400 }
      );
    }

    // Use better-auth's createInvitation API
    const data = await betterAuthService.organization.createInvitation({
      email,
      role,
      organizationId,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error creating invitation:", error);
    return NextResponse.json(
      { error: INVITATION_ERRORS.INTERNAL_SERVER_ERROR },
      { status: 500 }
    );
  }
}

