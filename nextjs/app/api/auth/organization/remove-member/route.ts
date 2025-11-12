import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { MEMBER_ERRORS, PERMISSION_RESOURCES, PERMISSION_ACTIONS } from "@/lib/constants";
import { requirePermission } from "@/lib/permission-check-server";

export async function POST(request: NextRequest) {
  try {
    console.log("[remove-member] Starting request");

    const permissionError = await requirePermission(
      PERMISSION_RESOURCES.ORGANIZATION,
      PERMISSION_ACTIONS.REMOVE
    );

    if (permissionError) {
      console.log("[remove-member] Permission check failed");
      return permissionError;
    }

    console.log("[remove-member] Permission check passed");

    const body = await request.json();
    const { organizationId, memberIdOrEmail } = body;

    console.log("[remove-member] Request body:", {
      organizationId,
      memberIdOrEmail,
    });

    if (!organizationId || !memberIdOrEmail) {
      console.log("[remove-member] Validation failed: Missing required fields", {
        hasOrganizationId: !!organizationId,
        hasMemberIdOrEmail: !!memberIdOrEmail,
      });
      return NextResponse.json(
        { error: MEMBER_ERRORS.REMOVE_FAILED },
        { status: 400 }
      );
    }

    // Check if user is an owner of the organization
    // Better Auth requires owner role to remove members
    const headersList = await headers();
    
    // Get current user's session to find their user ID
    const sessionData = await auth.api.getSession({ headers: headersList });
    const currentUserId = sessionData?.user?.id;

    if (!currentUserId) {
      console.log("[remove-member] No authenticated user found");
      return NextResponse.json(
        { error: MEMBER_ERRORS.REMOVE_FAILED },
        { status: 401 }
      );
    }

    // List members to find current user's role in this organization
    const membersResponse = await auth.api.listMembers({
      headers: headersList,
      query: { organizationId },
    });

    // Extract members from response (handle different response formats)
    let members: unknown[] = [];
    if (Array.isArray(membersResponse)) {
      members = membersResponse;
    } else if (membersResponse && typeof membersResponse === "object") {
      const response = membersResponse as { members?: unknown[]; data?: unknown[] };
      if (Array.isArray(response.members)) {
        members = response.members;
      } else if (Array.isArray(response.data)) {
        members = response.data;
      }
    }

    // Find current user's member record
    const currentMember = members.find(
      (m: unknown) =>
        (m as { userId?: string })?.userId === currentUserId ||
        (m as { user?: { id?: string } })?.user?.id === currentUserId
    );

    const userRole = currentMember
      ? (currentMember as { role?: string | string[] })?.role
      : null;

    // Better Auth returns role as string or array, check if it includes "owner"
    const userRoles = Array.isArray(userRole)
      ? userRole
      : userRole
        ? [userRole]
        : [];

    const isOwner = userRoles.includes("owner");

    console.log("[remove-member] Current user role in organization:", {
      userId: currentUserId,
      role: userRoles,
      isOwner,
    });

    if (!isOwner) {
      console.log("[remove-member] User is not an owner, cannot remove members");
      return NextResponse.json(
        { error: "Only organization owners can remove members" },
        { status: 403 }
      );
    }

    console.log(
      `[remove-member] Removing member ${memberIdOrEmail} from organization ${organizationId}`
    );

    // Set the organization as active before removing member
    // Better Auth may require the organization to be active in session context
    try {
      await auth.api.setActiveOrganization({
        headers: headersList,
        body: {
          organizationId,
        },
      });
      console.log("[remove-member] Organization set as active");
    } catch (setActiveError) {
      console.log("[remove-member] Warning: Failed to set active organization:", setActiveError);
      // Continue anyway, as this might not be required
    }

    // Call Better Auth's removeMember API directly
    const data = await auth.api.removeMember({
      headers: headersList,
      body: {
        memberIdOrEmail,
        organizationId,
      },
    });

    console.log(
      `[remove-member] Successfully removed member ${memberIdOrEmail} from organization ${organizationId}`
    );
    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    console.error("[remove-member] Error removing member:", error);

    // Check if it's an APIError from Better Auth
    const errorObj = error as {
      message?: string;
      body?: { message?: string };
      statusCode?: number;
      status?: number;
      name?: string;
    };
    const errorMessage =
      errorObj?.message || errorObj?.body?.message || String(error);
    const statusCode = errorObj?.statusCode || errorObj?.status || 500;

    console.log("[remove-member] Error details:", {
      message: errorMessage,
      statusCode,
      errorName: errorObj?.name,
    });

    // Return appropriate status code based on error
    const httpStatus =
      statusCode >= 400 && statusCode < 600 ? statusCode : 500;
    return NextResponse.json(
      { error: errorMessage || MEMBER_ERRORS.REMOVE_FAILED },
      { status: httpStatus }
    );
  }
}

