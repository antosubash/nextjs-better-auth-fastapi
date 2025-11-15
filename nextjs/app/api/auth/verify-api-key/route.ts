import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { API_KEY_ERRORS } from "@/lib/constants";

/**
 * Public endpoint to verify API keys.
 * This endpoint does not require authentication as it's used to verify API keys themselves.
 * Used by the FastAPI backend to verify API keys sent in X-API-Key headers.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, permissions } = body;

    if (!key) {
      return NextResponse.json(
        { valid: false, error: { message: "API key is required" } },
        { status: 400 }
      );
    }

    try {
      // Use Better Auth's internal API to verify the API key
      // Pass the API key in headers as X-API-Key for Better Auth to recognize it
      // This is a public endpoint, so we don't require session authentication
      const headers = new Headers();
      headers.set("X-API-Key", key);

      const result = await auth.api.verifyApiKey({
        headers,
        body: {
          key,
          permissions,
        },
      });

      // Better Auth returns the key data directly if valid
      // Format the response to match what the backend expects
      if (result?.key) {
        return NextResponse.json({
          valid: true,
          key: result.key,
        });
      }

      // If no key data returned, the key is invalid
      return NextResponse.json(
        {
          valid: false,
          error: { message: "Invalid API key" },
        },
        { status: 401 }
      );
    } catch (error: unknown) {
      // Handle Better Auth errors
      const errorMessage = error instanceof Error ? error.message : API_KEY_ERRORS.VERIFY_FAILED;

      // Check if it's a permission error (403)
      if (errorMessage.includes("permission") || errorMessage.includes("403")) {
        return NextResponse.json(
          {
            valid: false,
            error: { message: "Insufficient permissions" },
          },
          { status: 403 }
        );
      }

      // Check if it's an authentication error (401)
      if (errorMessage.includes("401") || errorMessage.includes("unauthorized")) {
        return NextResponse.json(
          {
            valid: false,
            error: { message: "Invalid API key" },
          },
          { status: 401 }
        );
      }

      // Generic error
      return NextResponse.json(
        {
          valid: false,
          error: { message: errorMessage },
        },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Failed to verify API key:", error);
    return NextResponse.json(
      {
        valid: false,
        error: { message: API_KEY_ERRORS.VERIFY_FAILED },
      },
      { status: 500 }
    );
  }
}
