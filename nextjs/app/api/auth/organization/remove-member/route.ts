import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { betterAuthService } from "@/lib/better-auth-service";
import { MEMBER_ERRORS } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, memberIdOrEmail } = body;

    if (!organizationId || !memberIdOrEmail) {
      return NextResponse.json({ error: MEMBER_ERRORS.REMOVE_FAILED }, { status: 400 });
    }

    const data = await betterAuthService.organization.removeMember({
      memberIdOrEmail,
      organizationId,
    });

    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    // Extract error message from different error types
    let errorMessage: string = MEMBER_ERRORS.REMOVE_FAILED;
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error && typeof error === "object") {
      const errorObj = error as {
        message?: string;
        body?: { message?: string };
        statusCode?: number;
        status?: number;
      };
      errorMessage = errorObj?.message || errorObj?.body?.message || String(error);
      statusCode = errorObj?.statusCode || errorObj?.status || 500;
    } else {
      errorMessage = String(error);
    }

    // Check for specific error messages to determine status code
    if (!statusCode || statusCode === 500) {
      if (errorMessage === MEMBER_ERRORS.ONLY_OWNERS_CAN_REMOVE) {
        statusCode = 403;
      } else if (errorMessage === MEMBER_ERRORS.REMOVE_FAILED) {
        statusCode = 400;
      }
    }

    // Return appropriate status code based on error
    const httpStatus = statusCode >= 400 && statusCode < 600 ? statusCode : 500;
    return NextResponse.json(
      { error: errorMessage || MEMBER_ERRORS.REMOVE_FAILED },
      { status: httpStatus }
    );
  }
}
