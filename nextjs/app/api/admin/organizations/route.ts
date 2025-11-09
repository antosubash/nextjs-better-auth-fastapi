import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ADMIN_ERRORS, ORGANIZATION_ERRORS, USER_ROLES } from "@/lib/constants";
import { normalizeDate } from "@/lib/utils/date";

export async function GET(_request: NextRequest) {
  try {
    const headersList = await headers();
    const sessionData = await auth.api.getSession({
      headers: headersList,
    });

    if (!sessionData?.user?.id) {
      return NextResponse.json(
        { error: ADMIN_ERRORS.ACCESS_DENIED },
        { status: 401 }
      );
    }

    const currentUser = sessionData.user;

    if (currentUser.role !== USER_ROLES.ADMIN) {
      return NextResponse.json(
        { error: ADMIN_ERRORS.ACCESS_DENIED },
        { status: 403 }
      );
    }

    // Use Better Auth API to list organizations
    // For admin users, this should return all organizations
    try {
      const organizations = await auth.api.listOrganizations({
        headers: headersList,
      });

      return NextResponse.json({
        organizations: organizations.map((org) => ({
          id: org.id,
          name: org.name,
          slug: org.slug,
          logo: org.logo || undefined,
          createdAt: normalizeDate(org.createdAt),
          metadata: org.metadata || undefined,
        })),
      });
    } catch (apiError) {
      console.error("Failed to fetch organizations via Better Auth API:", apiError);
      return NextResponse.json(
        { error: ORGANIZATION_ERRORS.LOAD_ORGANIZATIONS_FAILED },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Failed to fetch organizations:", error);
    return NextResponse.json(
      { error: ORGANIZATION_ERRORS.LOAD_ORGANIZATIONS_FAILED },
      { status: 500 }
    );
  }
}

