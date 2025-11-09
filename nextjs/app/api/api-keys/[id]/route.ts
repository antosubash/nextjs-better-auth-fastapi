import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/permission-check";
import { API_KEY_ERRORS } from "@/lib/constants";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permissionError = await requirePermission(
      _request,
      "apiKey",
      "read"
    );

    if (permissionError) {
      return permissionError;
    }

    const { id } = await params;
    const headersList = await headers();
    const result = await auth.api.getApiKey({
      headers: headersList,
      query: { id },
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Failed to get API key:", error);
    return NextResponse.json(
      { error: API_KEY_ERRORS.LOAD_API_KEY_FAILED },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permissionError = await requirePermission(
      request,
      "apiKey",
      "update"
    );

    if (permissionError) {
      return permissionError;
    }

    const { id } = await params;
    const headersList = await headers();
    const sessionData = await auth.api.getSession({
      headers: headersList,
    });

    if (!sessionData?.user?.id) {
      return NextResponse.json(
        { error: API_KEY_ERRORS.UPDATE_FAILED },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, expiresIn, metadata, permissions, enabled } = body;

    const result = await auth.api.updateApiKey({
      headers: headersList,
      body: {
        keyId: id,
        name,
        expiresIn,
        metadata,
        permissions,
        enabled,
      },
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Failed to update API key:", error);
    return NextResponse.json(
      { error: API_KEY_ERRORS.UPDATE_FAILED },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permissionError = await requirePermission(
      _request,
      "apiKey",
      "delete"
    );

    if (permissionError) {
      return permissionError;
    }

    const { id } = await params;
    const headersList = await headers();
    await auth.api.deleteApiKey({
      headers: headersList,
      body: {
        keyId: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete API key:", error);
    return NextResponse.json(
      { error: API_KEY_ERRORS.DELETE_FAILED },
      { status: 500 }
    );
  }
}

