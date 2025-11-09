import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/permission-check";
import { API_KEY_ERRORS } from "@/lib/constants";

export async function GET(_request: NextRequest) {
  try {
    const permissionError = await requirePermission(
      _request,
      "apiKey",
      "read"
    );

    if (permissionError) {
      return permissionError;
    }

    const headersList = await headers();
    const result = await auth.api.listApiKeys({
      headers: headersList,
    });

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
      request,
      "apiKey",
      "create"
    );

    if (permissionError) {
      return permissionError;
    }

    const headersList = await headers();
    const sessionData = await auth.api.getSession({
      headers: headersList,
    });

    if (!sessionData?.user?.id) {
      return NextResponse.json(
        { error: API_KEY_ERRORS.CREATE_FAILED },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, prefix, expiresIn, metadata, permissions } = body;

    const result = await auth.api.createApiKey({
      body: {
        name,
        prefix,
        expiresIn,
        metadata,
        permissions,
        userId: sessionData.user.id,
      },
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

