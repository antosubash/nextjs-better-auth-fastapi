/**
 * @deprecated This API route is deprecated. Use Better Auth client methods directly instead:
 * - authClient.listSessions() for listing sessions
 * - authClient.revokeSession({ token }) for revoking a session
 * - authClient.revokeOtherSessions() for revoking all other sessions
 * - authClient.revokeSessions() for revoking all sessions
 *
 * See: nextjs/lib/api/sessions.ts for the new implementation
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { betterAuthService } from "@/lib/better-auth-service";
import { SESSION_ERRORS } from "@/lib/constants";
import { requireAuth } from "@/lib/permission-check-server";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  try {
    const authResult = await requireAuth();

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { headers } = authResult;

    // Use Better Auth service to list user sessions
    const result = await betterAuthService.session.listMySessions(headers);

    const now = Date.now();
    const sessions = ((result as { sessions?: unknown[] })?.sessions || []).map(
      (session: unknown) => {
        const s = session as {
          id?: string;
          token?: string;
          ipAddress?: string | null;
          userAgent?: string | null;
          createdAt?: Date | number;
          expiresAt?: Date | number;
          [key: string]: unknown;
        };

        const createdAt =
          s.createdAt instanceof Date ? s.createdAt.getTime() : (s.createdAt as number) || 0;
        const expiresAt =
          s.expiresAt instanceof Date ? s.expiresAt.getTime() : (s.expiresAt as number) || 0;

        return {
          id: s.id || s.token || "",
          token: s.token || "",
          ipAddress: s.ipAddress || null,
          userAgent: s.userAgent || null,
          createdAt,
          expiresAt,
          isActive: expiresAt > now,
        };
      }
    );

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Failed to fetch sessions:", error);
    const errorMessage =
      error instanceof Error ? error.message : SESSION_ERRORS.LOAD_SESSIONS_FAILED;
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth();

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { headers } = authResult;

    const body = await request.json();
    const { sessionToken, revokeAll } = body;

    if (revokeAll) {
      // Use Better Auth service to revoke all other sessions
      const result = await betterAuthService.session.revokeAllOtherSessions(headers);

      return NextResponse.json({
        success: true,
        message: "All other sessions revoked",
        revokedCount: (result as { revokedCount?: number })?.revokedCount || 0,
      });
    }

    if (!sessionToken) {
      return NextResponse.json({ error: SESSION_ERRORS.SESSION_TOKEN_REQUIRED }, { status: 400 });
    }

    // Use Better Auth service to revoke the session
    await betterAuthService.session.revokeMySession({ sessionToken }, headers);

    return NextResponse.json({ success: true, message: "Session revoked" });
  } catch (error) {
    console.error("Failed to revoke session:", error);
    const errorMessage =
      error instanceof Error ? error.message : SESSION_ERRORS.REVOKE_SESSION_FAILED;
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
