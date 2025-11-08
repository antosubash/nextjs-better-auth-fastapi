import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, email, role } = body;

    if (!organizationId || !email || !role) {
      return NextResponse.json(
        { error: "Missing required fields: organizationId, email, role" },
        { status: 400 }
      );
    }

    // Use better-auth's createInvitation API
    const headersList = await headers();
    const data = await auth.api.createInvitation({
      body: {
        email,
        role,
        organizationId,
      },
      headers: headersList,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error creating invitation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

