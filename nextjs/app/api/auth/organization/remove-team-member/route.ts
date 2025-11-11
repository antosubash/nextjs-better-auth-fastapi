import { NextRequest, NextResponse } from "next/server";
import { betterAuthService } from "@/lib/better-auth-service/index";
import { TEAM_ERRORS, PERMISSION_RESOURCES, PERMISSION_ACTIONS } from "@/lib/constants";
import { requirePermission } from "@/lib/permission-check-server";

export async function POST(request: NextRequest) {
  try {
    const permissionError = await requirePermission(
      PERMISSION_RESOURCES.TEAM,
      PERMISSION_ACTIONS.UPDATE
    );

    if (permissionError) {
      return permissionError;
    }

    const body = await request.json();
    const { teamId, userId } = body;

    if (!teamId || !userId) {
      return NextResponse.json(
        { error: TEAM_ERRORS.REMOVE_MEMBER_FAILED },
        { status: 400 }
      );
    }

    const data = await betterAuthService.organization.removeTeamMember({
      teamId,
      userId,
    });

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error removing team member:", error);
    return NextResponse.json(
      { error: TEAM_ERRORS.REMOVE_MEMBER_FAILED },
      { status: 500 }
    );
  }
}

