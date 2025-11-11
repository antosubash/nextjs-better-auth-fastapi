import { NextRequest, NextResponse } from "next/server";
import { betterAuthService } from "@/lib/better-auth-service/index";
import {
  TEAM_ERRORS,
  PERMISSION_RESOURCES,
  PERMISSION_ACTIONS,
  ORGANIZATION_ROLES,
} from "@/lib/constants";
import { requirePermission } from "@/lib/permission-check-server";

export async function POST(request: NextRequest) {
  try {
    console.log("[add-team-member] Starting request");
    
    const permissionError = await requirePermission(
      PERMISSION_RESOURCES.TEAM,
      PERMISSION_ACTIONS.INVITE
    );

    if (permissionError) {
      return permissionError;
    }

    const body = await request.json();
    const { teamId, userId, organizationId } = body;

    console.log("[add-team-member] Request body:", {
      teamId,
      userId,
      organizationId,
    });

    if (!teamId || !userId) {
      console.log("[add-team-member] Validation failed: Missing teamId or userId");
      return NextResponse.json(
        { error: TEAM_ERRORS.ADD_MEMBER_FAILED },
        { status: 400 }
      );
    }

    if (!organizationId) {
      console.log("[add-team-member] Validation failed: Missing organizationId");
      return NextResponse.json(
        { error: TEAM_ERRORS.ADD_MEMBER_FAILED },
        { status: 400 }
      );
    }

    // Strategy: Ensure user is an organization member first, then add to team
    // Step 1: Try to add user to organization (if not already a member)
    try {
      console.log(
        `[add-team-member] Ensuring user ${userId} is a member of organization ${organizationId}`
      );
      await betterAuthService.organization.addMember({
        userId,
        role: ORGANIZATION_ROLES.MEMBER,
        organizationId,
      });
      console.log(
        `[add-team-member] User ${userId} is now a member of organization ${organizationId}`
      );
    } catch (addOrgMemberError: unknown) {
      const addOrgMemberErrorObj = addOrgMemberError as {
        message?: string;
        body?: { message?: string };
        statusCode?: number;
      };
      const addOrgMemberErrorMessage =
        addOrgMemberErrorObj?.message ||
        addOrgMemberErrorObj?.body?.message ||
        String(addOrgMemberError);

      // If user is already a member, that's fine - continue to add to team
      if (
        addOrgMemberErrorMessage.includes("already a member") ||
        addOrgMemberErrorMessage.includes("already exists")
      ) {
        console.log(
          `[add-team-member] User ${userId} is already a member of organization ${organizationId}`
        );
      } else {
        // If it's a different error, log and re-throw
        console.log(`[add-team-member] Failed to add user to organization:`, {
          message: addOrgMemberErrorMessage,
          statusCode: addOrgMemberErrorObj?.statusCode,
        });
        throw addOrgMemberError;
      }
    }

    // Step 2: Add user to team (now that we know they're an org member)
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

