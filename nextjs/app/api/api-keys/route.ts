import { NextRequest, NextResponse } from "next/server";
import { betterAuthService } from "@/lib/better-auth-service";
import { requirePermission } from "@/lib/permission-check";
import { API_KEY_ERRORS, PERMISSION_RESOURCES, PERMISSION_ACTIONS } from "@/lib/constants";

export async function GET(_request: NextRequest) {
  try {
    const permissionError = await requirePermission(
      PERMISSION_RESOURCES.API_KEY,
      PERMISSION_ACTIONS.READ
    );

    if (permissionError) {
      return permissionError;
    }

    const result = await betterAuthService.apiKey.listApiKeys();

    return NextResponse.json({ data: result || [] });
  } catch (error) {
    console.error("Failed to list API keys:", error);
    return NextResponse.json(
      { error: API_KEY_ERRORS.LOAD_API_KEYS_FAILED },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const permissionError = await requirePermission(
      PERMISSION_RESOURCES.API_KEY,
      PERMISSION_ACTIONS.CREATE
    );

    if (permissionError) {
      return permissionError;
    }

    const sessionData = await betterAuthService.session.getSession();

    const body = await request.json();
    const { name, prefix, expiresIn, metadata, permissions } = body;

    const result = await betterAuthService.apiKey.createApiKey({
      name,
      prefix,
      expiresIn,
      metadata,
      permissions,
      userId: sessionData?.user?.id || "",
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Failed to create API key:", error);
    const errorMessage =
      error instanceof Error && "message" in error
        ? error.message
        : API_KEY_ERRORS.CREATE_FAILED;
    const statusCode =
      error && typeof error === "object" && "statusCode" in error
        ? (error.statusCode as number)
        : 500;
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

