import { NextRequest, NextResponse } from "next/server";
import { betterAuthService } from "@/lib/better-auth-service/index";
import { TEAM_ERRORS, PERMISSION_RESOURCES, PERMISSION_ACTIONS } from "@/lib/constants";
import { requirePermission } from "@/lib/permission-check-server";

export async function POST(request: NextRequest) {
  try {
    const permissionError = await requirePermission(
      PERMISSION_RESOURCES.TEAM,
      PERMISSION_ACTIONS.CREATE
    );

    if (permissionError) {
      return permissionError;
    }

    // Get current user from session
    const sessionData = await betterAuthService.session.getSession();
    const currentUserId = sessionData?.user?.id;

    if (!currentUserId) {
      return NextResponse.json(
        { error: TEAM_ERRORS.CREATE_FAILED },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { organizationId, name } = body;

    if (!organizationId || !name) {
      return NextResponse.json(
        { error: TEAM_ERRORS.INVALID_NAME },
        { status: 400 }
      );
    }

    // Create the team
    const data = await betterAuthService.organization.createTeam({
      name,
      organizationId,
    });

    // Extract team ID from response
    // Better Auth may return the team directly or wrapped in data property
    let teamId: string | undefined;
    
    if (data && typeof data === "object") {
      // Try different possible response structures
      teamId = 
        (data as { data?: { id?: string } })?.data?.id ||
        (data as { id?: string })?.id ||
        (data as { team?: { id?: string } })?.team?.id ||
        (data as { data?: { team?: { id?: string } } })?.data?.team?.id;
    }

    if (!teamId) {
      console.error("Team created but team ID not found in response:", JSON.stringify(data, null, 2));
      // Still return success - team was created, we just can't add the user automatically
      return NextResponse.json(data, { status: 201 });
    }

    // Add current user to the team
    try {
      await betterAuthService.organization.addTeamMember({
        teamId,
        userId: currentUserId,
      });
    } catch (addMemberError) {
      // Log error but don't fail the team creation
      // The team creator might already be added automatically by Better Auth
      console.warn("Note: Could not add current user to team (may already be added):", addMemberError);
      // Continue - team was created successfully
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error creating team:", error);
    return NextResponse.json(
      { error: TEAM_ERRORS.CREATE_FAILED },
      { status: 500 }
    );
  }
}

