import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { betterAuthService } from "@/lib/better-auth-service/index";
import { API_KEY_ERRORS, PERMISSION_ACTIONS, PERMISSION_RESOURCES } from "@/lib/constants";
import { requirePermission } from "@/lib/permission-check-server";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const permissionError = await requirePermission(
      PERMISSION_RESOURCES.API_KEY,
      PERMISSION_ACTIONS.READ
    );

    if (permissionError) {
      return permissionError;
    }

    const { id } = await params;
    const result = await betterAuthService.apiKey.getApiKey(id);

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Failed to get API key:", error);
    return NextResponse.json({ error: API_KEY_ERRORS.LOAD_API_KEY_FAILED }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const permissionError = await requirePermission(
      PERMISSION_RESOURCES.API_KEY,
      PERMISSION_ACTIONS.UPDATE
    );

    if (permissionError) {
      return permissionError;
    }

    const { id } = await params;
    const body = await request.json();
    const { name, expiresIn, metadata, permissions, enabled } = body;

    const result = await betterAuthService.apiKey.updateApiKey({
      keyId: id,
      name,
      expiresIn,
      metadata,
      permissions,
      enabled,
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Failed to update API key:", error);
    return NextResponse.json({ error: API_KEY_ERRORS.UPDATE_FAILED }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permissionError = await requirePermission(
      PERMISSION_RESOURCES.API_KEY,
      PERMISSION_ACTIONS.DELETE
    );

    if (permissionError) {
      return permissionError;
    }

    const { id } = await params;
    await betterAuthService.apiKey.deleteApiKey(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete API key:", error);
    return NextResponse.json({ error: API_KEY_ERRORS.DELETE_FAILED }, { status: 500 });
  }
}
