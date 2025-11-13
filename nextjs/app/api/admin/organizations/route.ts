import { NextResponse } from "next/server";
import { betterAuthService } from "@/lib/better-auth-service/index";
import { ORGANIZATION_ERRORS } from "@/lib/constants";
import { requireAdmin } from "@/lib/permission-check-server";
import { normalizeDate } from "@/lib/utils/date";

export async function GET() {
  try {
    const adminCheck = await requireAdmin();
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    // Use Better Auth API to list organizations
    // For admin users, this should return all organizations
    try {
      const organizations = await betterAuthService.organization.listOrganizations();

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
