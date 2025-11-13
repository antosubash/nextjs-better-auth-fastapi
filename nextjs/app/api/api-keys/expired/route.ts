import { NextRequest, NextResponse } from "next/server";
import { betterAuthService } from "@/lib/better-auth-service/index";
import { API_KEY_ERRORS, PERMISSION_RESOURCES, PERMISSION_ACTIONS } from "@/lib/constants";
import { requirePermission } from "@/lib/permission-check-server";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function DELETE(_request: NextRequest) {
  try {
    const permissionError = await requirePermission(
      PERMISSION_RESOURCES.API_KEY,
      PERMISSION_ACTIONS.DELETE
    );

    if (permissionError) {
      return permissionError;
    }

    await betterAuthService.apiKey.deleteAllExpiredApiKeys();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete expired API keys:", error);
    return NextResponse.json({ error: API_KEY_ERRORS.DELETE_EXPIRED_FAILED }, { status: 500 });
  }
}
