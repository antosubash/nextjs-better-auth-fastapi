import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/database";
import { session, user } from "@/lib/auth-schema";
import { eq, and, gt, desc, sql } from "drizzle-orm";

export async function GET(_request: NextRequest) {
  try {
    // Use Next.js headers() to ensure cookies are included
    const headersList = await headers();
    const sessionData = await auth.api.getSession({
      headers: headersList,
    });

    if (!sessionData?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = sessionData.user.id;
    const now = new Date();

    // Get user info first
    const userData = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userData.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const currentUser = userData[0];

    // Get user's active sessions count
    let sessionsCount = 0;
    try {
      const activeSessions = await db
        .select({ count: sql<number>`count(*)` })
        .from(session)
        .where(
          and(
            eq(session.userId, userId),
            gt(session.expiresAt, now)
          )
        );
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
      .filter((s) => s.createdAt !== null)
      .map((s) => ({
        type: "session",
        message: "Session created",
        timestamp: s.createdAt!,
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
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch user statistics";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

