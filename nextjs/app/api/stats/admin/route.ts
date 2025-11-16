import { NextResponse } from "next/server";
import { betterAuthService } from "@/lib/better-auth-service/index";
import { STATS_ERRORS } from "@/lib/constants";
import { requireAdmin } from "@/lib/permission-check-server";

export async function GET() {
  try {
    const adminCheck = await requireAdmin();
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const now = Date.now();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Get all users using Better Auth API
    const allUsersResult = await betterAuthService.admin.listUsers({
      sortBy: "createdAt",
      sortDirection: "desc",
    });

    const allUsers = (allUsersResult as { users?: unknown[] })?.users || [];
    const totalUsers = allUsers.length;

    // Count banned users
    const bannedUsersResult = await betterAuthService.admin.listUsers({
      filterField: "banned",
      filterValue: true,
      filterOperator: "eq",
    });
    const bannedUsers = ((bannedUsersResult as { users?: unknown[] })?.users || []).length;

    // Get recent users (last 10)
    const recentUsers = allUsers.slice(0, 10).map((u: unknown) => {
      const user = u as {
        id?: string;
        name?: string;
        email?: string;
        role?: string;
        createdAt?: string | Date;
        banned?: boolean;
      };

      return {
        id: user.id || "",
        name: user.name || "",
        email: user.email || "",
        role: user.role || null,
        createdAt: user.createdAt
          ? new Date(user.createdAt).toISOString()
          : new Date().toISOString(),
        banned: user.banned || false,
      };
    });

    // Count recent registrations (last 7 days)
    const recentRegistrations = allUsers.filter((u: unknown) => {
      const user = u as { createdAt?: string | Date };
      if (!user.createdAt) return false;
      const createdAt = new Date(user.createdAt).getTime();
      return createdAt >= new Date(sevenDaysAgo).getTime();
    }).length;

    // Get active sessions and recent sessions
    // We need to iterate through users to get their sessions
    let activeSessions = 0;
    const allSessions: Array<{
      id: string;
      userId: string;
      createdAt: number;
      expiresAt: number;
      ipAddress: string | null;
      userAgent: string | null;
      userName: string;
      userEmail: string;
    }> = [];

    // Get sessions for each user (limit to first 50 users to avoid too many API calls)
    const usersToCheck = allUsers.slice(0, 50);
    for (const user of usersToCheck) {
      const u = user as { id?: string; name?: string; email?: string };
      if (!u.id) continue;

      try {
        const sessionsResult = await betterAuthService.admin.listUserSessions({
          userId: u.id,
        });
        const sessions = (sessionsResult as { sessions?: unknown[] })?.sessions || [];

        for (const session of sessions) {
          const s = session as {
            id?: string;
            token?: string;
            createdAt?: Date | number;
            expiresAt?: Date | number;
            ipAddress?: string | null;
            userAgent?: string | null;
          };

          const expiresAt =
            s.expiresAt instanceof Date
              ? s.expiresAt.getTime()
              : (s.expiresAt as number) || 0;

          if (expiresAt > now) {
            activeSessions++;
          }

          const createdAt =
            s.createdAt instanceof Date
              ? s.createdAt.getTime()
              : (s.createdAt as number) || 0;

          allSessions.push({
            id: s.id || s.token || "",
            userId: u.id,
            createdAt,
            expiresAt,
            ipAddress: s.ipAddress || null,
            userAgent: s.userAgent || null,
            userName: u.name || "",
            userEmail: u.email || "",
          });
        }
      } catch (err) {
        // Continue if we can't get sessions for a user
        console.error(`Error fetching sessions for user ${u.id}:`, err);
      }
    }

    // Sort sessions by creation date and get recent 10
    const recentSessions = allSessions
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10)
      .map((s) => ({
        id: s.id,
        userId: s.userId,
        createdAt: new Date(s.createdAt).toISOString(),
        expiresAt: new Date(s.expiresAt).toISOString(),
        ipAddress: s.ipAddress,
        userAgent: s.userAgent,
        userName: s.userName,
        userEmail: s.userEmail,
      }));

    return NextResponse.json({
      totalUsers,
      activeSessions,
      bannedUsers,
      recentRegistrations,
      recentUsers,
      recentSessions,
    });
  } catch (error) {
    console.error("Failed to fetch admin stats:", error);
    return NextResponse.json({ error: STATS_ERRORS.LOAD_ADMIN_STATS_FAILED }, { status: 500 });
  }
}
