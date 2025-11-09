import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { API_KEY_ERRORS } from "@/lib/constants";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function DELETE(_request: NextRequest) {
  try {
    const headersList = await headers();
    const sessionData = await auth.api.getSession({
      headers: headersList,
    });

    if (!sessionData?.user?.id) {
      return NextResponse.json(
        { error: API_KEY_ERRORS.DELETE_EXPIRED_FAILED },
        { status: 401 }
      );
    }

    await auth.api.deleteAllExpiredApiKeys();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete expired API keys:", error);
    return NextResponse.json(
      { error: API_KEY_ERRORS.DELETE_EXPIRED_FAILED },
      { status: 500 }
    );
  }
}

