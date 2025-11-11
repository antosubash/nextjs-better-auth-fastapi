import { NextRequest, NextResponse } from "next/server";
import { betterAuthService } from "@/lib/better-auth-service/index";
import { ORGANIZATION_ERRORS } from "@/lib/constants";
import { requireAdmin } from "@/lib/permission-check-server";
import { normalizeDate } from "@/lib/utils/date";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const adminCheck = await requireAdmin();
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
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
      const organizations = await betterAuthService.organization.listOrganizations();

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

