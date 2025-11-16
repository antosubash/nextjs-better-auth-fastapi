import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { betterAuthService } from "@/lib/better-auth-service/index";
import { STATS_ERRORS, STATS_LABELS } from "@/lib/constants";
import { requireAuth } from "@/lib/permission-check-server";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  try {
    const authResult = await requireAuth();

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const sessionData = authResult.session;

    const userId = sessionData?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: STATS_ERRORS.USER_NOT_FOUND }, { status: 404 });
    }

    const currentUser = sessionData?.user;

    if (!currentUser) {
      return NextResponse.json({ error: STATS_ERRORS.USER_NOT_FOUND }, { status: 404 });
    }

    const now = Date.now();

    // Get user's sessions using Better Auth API
    let sessionsCount = 0;
    let recentSessions: Array<{
      id: string;
      createdAt: number | null;
      expiresAt: number;
      ipAddress: string | null;
      userAgent: string | null;
    }> = [];

    try {
      const sessionsResult = await betterAuthService.session.listMySessions();
      const sessions = (sessionsResult as { sessions?: unknown[] })?.sessions || [];

      // Filter active sessions and get recent ones
      const activeSessions = sessions.filter((s: unknown) => {
        const session = s as { expiresAt?: Date | number };
        const expiresAt =
          session.expiresAt instanceof Date
            ? session.expiresAt.getTime()
            : (session.expiresAt as number) || 0;
        return expiresAt > now;
      });

      sessionsCount = activeSessions.length;

      // Get recent sessions (last 5)
      recentSessions = sessions
        .slice(0, 5)
        .map((s: unknown) => {
          const session = s as {
            id?: string;
            token?: string;
            createdAt?: Date | number;
            expiresAt?: Date | number;
            ipAddress?: string | null;
            userAgent?: string | null;
          };

          const createdAt =
            session.createdAt instanceof Date
              ? session.createdAt.getTime()
              : (session.createdAt as number) || null;
          const expiresAt =
            session.expiresAt instanceof Date
              ? session.expiresAt.getTime()
              : (session.expiresAt as number) || 0;

          return {
            id: session.id || session.token || "",
            createdAt,
            expiresAt,
            ipAddress: session.ipAddress || null,
            userAgent: session.userAgent || null,
          };
        });
    } catch (err) {
      console.error("Error fetching sessions:", err);
      // Continue with 0 sessions if query fails
    }

    // Format recent activity
    const recentActivity = recentSessions
      .filter((s): s is typeof s & { createdAt: number } => s.createdAt !== null)
      .map((s) => ({
        type: "session",
        message: STATS_LABELS.SESSION_CREATED,
        timestamp: s.createdAt,
        details: {
          ipAddress: s.ipAddress || undefined,
          userAgent: s.userAgent || undefined,
        },
      }));

    return NextResponse.json({
      sessionsCount: Number(sessionsCount),
      accountCreatedAt: currentUser.createdAt
        ? new Date(currentUser.createdAt).toISOString()
        : new Date().toISOString(),
      emailVerified: currentUser.emailVerified || false,
      recentActivity,
    });
  } catch (error) {
    console.error("Failed to fetch user stats:", error);
    return NextResponse.json({ error: STATS_ERRORS.LOAD_USER_STATS_FAILED }, { status: 500 });
  }
}
