import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { API_KEY_ERRORS } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const sessionData = await auth.api.getSession({
      headers: headersList,
    });

    if (!sessionData?.user?.id) {
      return NextResponse.json(
        { error: API_KEY_ERRORS.VERIFY_FAILED },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { key, permissions } = body;

    const result = await auth.api.verifyApiKey({
      headers: headersList,
      body: {
        key,
        permissions,
      },
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

