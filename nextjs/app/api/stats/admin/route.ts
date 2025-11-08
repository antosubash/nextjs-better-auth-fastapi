import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/database";
import { session, user } from "@/lib/auth-schema";
import { eq, gt, desc, sql } from "drizzle-orm";

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

    const currentUser = sessionData.user;

    if (currentUser.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Count total users
    const totalUsersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(user);

    const totalUsers = Number(totalUsersResult[0]?.count ?? 0);

    // Count active sessions
    const activeSessionsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(session)
      .where(gt(session.expiresAt, now));

    const activeSessions = Number(activeSessionsResult[0]?.count ?? 0);

    // Count banned users
    const bannedUsersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(user)
      .where(eq(user.banned, true));

    const bannedUsers = Number(bannedUsersResult[0]?.count ?? 0);

    // Count recent registrations (last 7 days)
    const recentRegistrationsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(user)
      .where(gt(user.createdAt, sevenDaysAgo));

    const recentRegistrations = Number(recentRegistrationsResult[0]?.count ?? 0);

    // Get recent users (last 10)
    const recentUsers = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        banned: user.banned,
      })
      .from(user)
      .orderBy(desc(user.createdAt))
      .limit(10);

    // Get recent sessions (last 10) with user info
    const recentSessions = await db
      .select({
        id: session.id,
        userId: session.userId,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        userName: user.name,
        userEmail: user.email,
      })
      .from(session)
      .innerJoin(user, eq(session.userId, user.id))
      .orderBy(desc(session.createdAt))
      .limit(10);

    return NextResponse.json({
      totalUsers,
      activeSessions,
      bannedUsers,
      recentRegistrations,
      recentUsers: recentUsers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
        banned: u.banned,
      })),
      recentSessions: recentSessions.map((s) => ({
        id: s.id,
        userId: s.userId,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        ipAddress: s.ipAddress,
        userAgent: s.userAgent,
        userName: s.userName,
        userEmail: s.userEmail,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch admin stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin statistics" },
      { status: 500 }
    );
  }
}

