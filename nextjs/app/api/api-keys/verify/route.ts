import { NextRequest, NextResponse } from "next/server";
import { betterAuthService } from "@/lib/better-auth-service";
import { API_KEY_ERRORS, PERMISSION_RESOURCES, PERMISSION_ACTIONS } from "@/lib/constants";
import { requirePermission } from "@/lib/permission-check";

export async function POST(request: NextRequest) {
  try {
    const permissionError = await requirePermission(
      PERMISSION_RESOURCES.API_KEY,
      PERMISSION_ACTIONS.READ
    );

    if (permissionError) {
      return permissionError;
    }

    const body = await request.json();
    const { key, permissions } = body;

    const result = await betterAuthService.apiKey.verifyApiKey({
      key,
      permissions,
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Failed to verify API key:", error);
    return NextResponse.json(
      { error: API_KEY_ERRORS.VERIFY_FAILED },
      { status: 500 }
    );
  }
}

