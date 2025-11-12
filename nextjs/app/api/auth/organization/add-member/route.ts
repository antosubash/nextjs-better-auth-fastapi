import { NextRequest, NextResponse } from "next/server";
import { betterAuthService } from "@/lib/better-auth-service/index";
import { MEMBER_ERRORS, PERMISSION_RESOURCES, PERMISSION_ACTIONS } from "@/lib/constants";
import { requirePermission } from "@/lib/permission-check-server";

export async function POST(request: NextRequest) {
  try {
    console.log("[add-member] Starting request");

    const permissionError = await requirePermission(
      PERMISSION_RESOURCES.ORGANIZATION,
      PERMISSION_ACTIONS.INVITE
    );

    if (permissionError) {
      console.log("[add-member] Permission check failed");
      return permissionError;
    }

    console.log("[add-member] Permission check passed");

    const body = await request.json();
    const { organizationId, userId, role } = body;

    console.log("[add-member] Request body:", {
      organizationId,
      userId,
      role,
    });

    if (!organizationId || !userId || !role) {
      console.log("[add-member] Validation failed: Missing required fields", {
        hasOrganizationId: !!organizationId,
        hasUserId: !!userId,
        hasRole: !!role,
      });
      return NextResponse.json(
        { error: MEMBER_ERRORS.ADD_FAILED },
        { status: 400 }
      );
    }

    console.log(
      `[add-member] Adding user ${userId} to organization ${organizationId} with role ${role}`
    );

    // Use better-auth's addMember API
    const data = await betterAuthService.organization.addMember({
      userId,
      role,
      organizationId,
    });

    console.log(
      `[add-member] Successfully added user ${userId} to organization ${organizationId}`
    );
    return NextResponse.json(data, { status: 201 });
  } catch (error: unknown) {
    console.error("[add-member] Error adding member:", error);

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

    console.log("[add-member] Error details:", {
      message: errorMessage,
      statusCode,
      errorName: errorObj?.name,
    });

    // Return appropriate status code based on error
    const httpStatus =
      statusCode >= 400 && statusCode < 600 ? statusCode : 500;
    return NextResponse.json(
      { error: errorMessage || MEMBER_ERRORS.ADD_FAILED },
      { status: httpStatus }
    );
  }
}

