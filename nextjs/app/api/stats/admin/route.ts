import { NextResponse } from "next/server";
import { betterAuthService } from "@/lib/better-auth-service/index";
import { STATS_ERRORS } from "@/lib/constants";
import { requireAdmin } from "@/lib/permission-check-server";

type User = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  createdAt?: string | Date;
  banned?: boolean;
};

type Session = {
  id?: string;
  token?: string;
  createdAt?: Date | number;
  expiresAt?: Date | number;
  ipAddress?: string | null;
  userAgent?: string | null;
};

type SessionData = {
  id: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
  ipAddress: string | null;
  userAgent: string | null;
  userName: string;
  userEmail: string;
};

async function getAllUsers() {
  const allUsersResult = await betterAuthService.admin.listUsers({
    sortBy: "createdAt",
    sortDirection: "desc",
  });
  return (allUsersResult as { users?: unknown[] })?.users || [];
}

async function getBannedUsersCount() {
  const bannedUsersResult = await betterAuthService.admin.listUsers({
    filterField: "banned",
    filterValue: true,
    filterOperator: "eq",
  });
  return ((bannedUsersResult as { users?: unknown[] })?.users || []).length;
}

function getRecentUsers(allUsers: unknown[]) {
  return allUsers.slice(0, 10).map((u: unknown) => {
    const user = u as User;
    return {
      id: user.id || "",
      name: user.name || "",
      email: user.email || "",
      role: user.role || null,
      createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString(),
      banned: user.banned || false,
    };
  });
}

function getRecentRegistrationsCount(allUsers: unknown[], sevenDaysAgo: string) {
  return allUsers.filter((u: unknown) => {
    const user = u as { createdAt?: string | Date };
    if (!user.createdAt) return false;
    const createdAt = new Date(user.createdAt).getTime();
    return createdAt >= new Date(sevenDaysAgo).getTime();
  }).length;
}

function processSession(
  session: unknown,
  userId: string,
  userName: string,
  userEmail: string
): SessionData | null {
  const s = session as Session;
  const expiresAt =
    s.expiresAt instanceof Date ? s.expiresAt.getTime() : (s.expiresAt as number) || 0;
  const createdAt =
    s.createdAt instanceof Date ? s.createdAt.getTime() : (s.createdAt as number) || 0;

  return {
    id: s.id || s.token || "",
    userId,
    createdAt,
    expiresAt,
    ipAddress: s.ipAddress || null,
    userAgent: s.userAgent || null,
    userName,
    userEmail,
  };
}

async function getUserSessions(
  userId: string,
  userName: string,
  userEmail: string
): Promise<SessionData[]> {
  try {
    const sessionsResult = await betterAuthService.admin.listUserSessions({
      userId,
    });
    const sessions = (sessionsResult as { sessions?: unknown[] })?.sessions || [];

    return sessions
      .map((session) => processSession(session, userId, userName, userEmail))
      .filter((s): s is SessionData => s !== null);
  } catch (err) {
    console.error(`Error fetching sessions for user ${userId}:`, err);
    return [];
  }
}

async function getAllSessions(allUsers: unknown[]) {
  const usersToCheck = allUsers.slice(0, 50);
  const allSessions: SessionData[] = [];

  for (const user of usersToCheck) {
    const u = user as { id?: string; name?: string; email?: string };
    if (!u.id) continue;

    const sessions = await getUserSessions(u.id, u.name || "", u.email || "");
    allSessions.push(...sessions);
  }

  return allSessions;
}

function getActiveSessionsCount(allSessions: SessionData[], now: number) {
  return allSessions.filter((s) => s.expiresAt > now).length;
}

function getRecentSessions(allSessions: SessionData[]) {
  return allSessions
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
}

export async function GET() {
  try {
    const adminCheck = await requireAdmin();
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const now = Date.now();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

    const allUsers = await getAllUsers();
    const totalUsers = allUsers.length;
    const bannedUsers = await getBannedUsersCount();
    const recentUsers = getRecentUsers(allUsers);
    const recentRegistrations = getRecentRegistrationsCount(allUsers, sevenDaysAgo);

    const allSessions = await getAllSessions(allUsers);
    const activeSessions = getActiveSessionsCount(allSessions, now);
    const recentSessions = getRecentSessions(allSessions);

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
