import { desc, eq, gt, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { session, user } from "@/auth-schema";
import { STATS_ERRORS } from "@/lib/constants";
import { db } from "@/lib/database";
import { requireAdmin } from "@/lib/permission-check-server";

export async function GET() {
  try {
    const adminCheck = await requireAdmin();
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Count total users
    const totalUsersResult = await db.select({ count: sql<number>`count(*)` }).from(user);

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
    return NextResponse.json({ error: STATS_ERRORS.LOAD_ADMIN_STATS_FAILED }, { status: 500 });
  }
}
