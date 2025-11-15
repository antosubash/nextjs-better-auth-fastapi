import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { betterAuthService } from "@/lib/better-auth-service/index";
import { MEMBER_ERRORS, PERMISSION_ACTIONS, PERMISSION_RESOURCES } from "@/lib/constants";
import { requirePermission } from "@/lib/permission-check-server";

export async function POST(request: NextRequest) {
  const logger = (await import("@/lib/utils/logger")).createLogger("api/auth/organization");
  try {
    logger.debug("Starting request");

    const permissionError = await requirePermission(
      PERMISSION_RESOURCES.ORGANIZATION,
      PERMISSION_ACTIONS.INVITE
    );

    if (permissionError) {
      logger.debug("Permission check failed");
      return permissionError;
    }

    logger.debug("Permission check passed");

    const body = await request.json();
    const { organizationId, userId, role } = body;

    logger.debug("Request body", {
      organizationId,
      userId,
      role,
    });

    if (!organizationId || !userId || !role) {
      logger.debug("Validation failed: Missing required fields", {
        hasOrganizationId: !!organizationId,
        hasUserId: !!userId,
        hasRole: !!role,
      });
      return NextResponse.json({ error: MEMBER_ERRORS.ADD_FAILED }, { status: 400 });
    }

    logger.debug(`Adding user ${userId} to organization ${organizationId} with role ${role}`);

    // Use better-auth's addMember API
    const data = await betterAuthService.organization.addMember({
      userId,
      role,
      organizationId,
    });

    logger.info(`Successfully added user ${userId} to organization ${organizationId}`);
    return NextResponse.json(data, { status: 201 });
  } catch (error: unknown) {
    logger.error("Error adding member", error);

    // Check if it's an APIError from Better Auth
    const errorObj = error as {
      message?: string;
      body?: { message?: string };
      statusCode?: number;
      status?: number;
      name?: string;
    };
    const errorMessage = errorObj?.message || errorObj?.body?.message || String(error);
    const statusCode = errorObj?.statusCode || errorObj?.status || 500;

    logger.debug("Error details", {
      message: errorMessage,
      statusCode,
      errorName: errorObj?.name,
    });

    // Return appropriate status code based on error
    const httpStatus = statusCode >= 400 && statusCode < 600 ? statusCode : 500;
    return NextResponse.json(
      { error: errorMessage || MEMBER_ERRORS.ADD_FAILED },
      { status: httpStatus }
    );
  }
}
