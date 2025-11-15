import { and, desc, eq, gt, sql } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { session, user } from "@/auth-schema";
import { betterAuthService } from "@/lib/better-auth-service/index";
import {
  PERMISSION_ACTIONS,
  PERMISSION_RESOURCES,
  STATS_ERRORS,
  STATS_LABELS,
} from "@/lib/constants";
import { db } from "@/lib/database";
import { requirePermission } from "@/lib/permission-check-server";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  try {
    const permissionError = await requirePermission(
      PERMISSION_RESOURCES.USER,
      PERMISSION_ACTIONS.READ
    );

    if (permissionError) {
      return permissionError;
    }

    const sessionData = await betterAuthService.session.getSession();

    const userId = sessionData?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: STATS_ERRORS.USER_NOT_FOUND }, { status: 404 });
    }

    const now = new Date();

    // Get user info first
    const userData = await db.select().from(user).where(eq(user.id, userId)).limit(1);

    if (userData.length === 0) {
      return NextResponse.json({ error: STATS_ERRORS.USER_NOT_FOUND }, { status: 404 });
    }

    const currentUser = userData[0];

    // Get user's active sessions count
    let sessionsCount = 0;
    try {
      const activeSessions = await db
        .select({ count: sql<number>`count(*)` })
        .from(session)
        .where(and(eq(session.userId, userId), gt(session.expiresAt, now)));
      sessionsCount = Number(activeSessions[0]?.count ?? 0);
    } catch (err) {
      console.error("Error fetching active sessions:", err);
      // Continue with 0 sessions if query fails
    }

    // Get recent sessions (last 5)
    let recentSessions: Array<{
      id: string;
      createdAt: number | null;
      expiresAt: number;
      ipAddress: string | null;
      userAgent: string | null;
    }> = [];

    try {
      const sessions = await db
        .select({
          id: session.id,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
        })
        .from(session)
        .where(eq(session.userId, userId))
        .orderBy(desc(session.createdAt))
        .limit(5);
      recentSessions = sessions.map((s) => ({
        id: s.id,
        createdAt: s.createdAt ? s.createdAt.getTime() : null,
        expiresAt: s.expiresAt.getTime(),
        ipAddress: s.ipAddress,
        userAgent: s.userAgent,
      }));
    } catch (err) {
      console.error("Error fetching recent sessions:", err);
      // Continue with empty array if query fails
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
      accountCreatedAt: currentUser.createdAt,
      emailVerified: currentUser.emailVerified,
      recentActivity,
    });
  } catch (error) {
    console.error("Failed to fetch user stats:", error);
    return NextResponse.json({ error: STATS_ERRORS.LOAD_USER_STATS_FAILED }, { status: 500 });
  }
}
