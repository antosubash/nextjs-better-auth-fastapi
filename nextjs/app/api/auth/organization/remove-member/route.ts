import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { betterAuthService } from "@/lib/better-auth-service";
import { MEMBER_ERRORS } from "@/lib/constants";

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (error && typeof error === "object") {
    const errorObj = error as {
      message?: string;
      body?: { message?: string };
    };
    return errorObj?.message || errorObj?.body?.message || String(error);
  }
  return String(error);
}

function extractStatusCode(error: unknown): number | undefined {
  if (error && typeof error === "object") {
    const errorObj = error as {
      statusCode?: number;
      status?: number;
    };
    return errorObj?.statusCode || errorObj?.status;
  }
  return undefined;
}

function determineStatusCode(errorMessage: string, extractedStatus?: number): number {
  if (extractedStatus && extractedStatus >= 400 && extractedStatus < 600) {
    return extractedStatus;
  }

  if (errorMessage === MEMBER_ERRORS.ONLY_OWNERS_CAN_REMOVE) {
    return 403;
  }
  if (errorMessage === MEMBER_ERRORS.REMOVE_FAILED) {
    return 400;
  }

  return 500;
}

function handleRemoveMemberError(error: unknown): NextResponse {
  const errorMessage = extractErrorMessage(error);
  const extractedStatus = extractStatusCode(error);
  const statusCode = determineStatusCode(errorMessage, extractedStatus);

  return NextResponse.json(
    { error: errorMessage || MEMBER_ERRORS.REMOVE_FAILED },
    { status: statusCode }
  );
}

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
    return handleRemoveMemberError(error);
  }
}
