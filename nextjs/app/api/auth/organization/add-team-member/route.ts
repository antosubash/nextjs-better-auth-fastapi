import { NextRequest, NextResponse } from "next/server";
import { betterAuthService } from "@/lib/better-auth-service/index";
import {
  TEAM_ERRORS,
  PERMISSION_RESOURCES,
  PERMISSION_ACTIONS,
} from "@/lib/constants";
import { requirePermission } from "@/lib/permission-check-server";

export async function POST(request: NextRequest) {
  try {
    console.log("[add-team-member] Starting request");
    
    const permissionError = await requirePermission(
      PERMISSION_RESOURCES.MEMBER,
      PERMISSION_ACTIONS.UPDATE
    );

    if (permissionError) {
      return permissionError;
    }

    const body = await request.json();
    const { teamId, userId } = body;

    console.log("[add-team-member] Request body:", {
      teamId,
      userId,
    });

    if (!teamId || !userId) {
      console.log("[add-team-member] Validation failed: Missing teamId or userId");
      return NextResponse.json(
        { error: TEAM_ERRORS.ADD_MEMBER_FAILED },
        { status: 400 }
      );
    }

    // Add user to team (user must already be a member of the organization)
    console.log(`[add-team-member] Adding user ${userId} to team ${teamId}`);
    const data = await betterAuthService.organization.addTeamMember({
      teamId,
      userId,
    });

    console.log(
      `[add-team-member] Successfully added user ${userId} to team ${teamId}`
    );
    return NextResponse.json(data, { status: 201 });
  } catch (error: unknown) {
    console.error("[add-team-member] Error adding team member:", error);
    
    // Check if it's an APIError from Better Auth
    const errorObj = error as { message?: string; body?: { message?: string }; statusCode?: number; status?: number; name?: string };
    const errorMessage = errorObj?.message || errorObj?.body?.message || String(error);
    const statusCode = errorObj?.statusCode || errorObj?.status || 500;
    
    console.log("[add-team-member] Error details:", {
      message: errorMessage,
      statusCode,
      errorName: errorObj?.name,
    });

    // If user is already a team member, return a more specific error
    if (
      errorMessage.includes("already a member") ||
      errorMessage.includes("already exists")
    ) {
      return NextResponse.json(
        { error: TEAM_ERRORS.MEMBER_ALREADY_IN_TEAM },
        { status: 400 }
      );
    }

    // Return appropriate status code based on error
    const httpStatus = statusCode >= 400 && statusCode < 600 ? statusCode : 500;
    return NextResponse.json(
      { error: errorMessage || TEAM_ERRORS.ADD_MEMBER_FAILED },
      { status: httpStatus }
    );
  }
}

