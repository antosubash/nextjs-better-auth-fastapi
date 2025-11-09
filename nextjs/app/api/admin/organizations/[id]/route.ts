import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ADMIN_ERRORS, ORGANIZATION_ERRORS, USER_ROLES } from "@/lib/constants";
import { normalizeDate } from "@/lib/utils/date";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const headersList = await headers();
    const sessionData = await auth.api.getSession({
      headers: headersList,
    });

    if (!sessionData?.user?.id) {
      return NextResponse.json(
        { error: ADMIN_ERRORS.ACCESS_DENIED },
        { status: 401 },
      );
    }

    const currentUser = sessionData.user;

    if (currentUser.role !== USER_ROLES.ADMIN) {
      return NextResponse.json(
        { error: ADMIN_ERRORS.ACCESS_DENIED },
        { status: 403 },
      );
    }

    const { id: organizationId } = await params;

    if (!organizationId) {
      return NextResponse.json(
        { error: ORGANIZATION_ERRORS.LOAD_ORGANIZATION_FAILED },
        { status: 400 },
      );
    }

    // Use Better Auth API to list organizations and find the one by ID
    try {
      const organizations = await auth.api.listOrganizations({
        headers: headersList,
      });

      const organization = organizations.find((org) => org.id === organizationId);

      if (!organization) {
        return NextResponse.json(
          { error: ORGANIZATION_ERRORS.LOAD_ORGANIZATION_FAILED },
          { status: 404 },
        );
      }

      return NextResponse.json({
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          logo: organization.logo || undefined,
          createdAt: normalizeDate(organization.createdAt),
          metadata: organization.metadata || undefined,
        },
      });
    } catch (apiError) {
      console.error(
        "Failed to fetch organization via Better Auth API:",
        apiError,
      );
      return NextResponse.json(
        { error: ORGANIZATION_ERRORS.LOAD_ORGANIZATION_FAILED },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Failed to fetch organization:", error);
    return NextResponse.json(
      { error: ORGANIZATION_ERRORS.LOAD_ORGANIZATION_FAILED },
      { status: 500 },
    );
  }
}

