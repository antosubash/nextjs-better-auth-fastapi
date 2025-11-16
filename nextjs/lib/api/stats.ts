export interface UserStats {
  sessionsCount: number;
  accountCreatedAt: number;
  emailVerified: boolean;
  recentActivity: Array<{
    type: string;
    message: string;
    timestamp: number;
    details?: {
      ipAddress?: string;
      userAgent?: string;
    };
  }>;
}

export interface AdminStats {
  totalUsers: number;
  activeSessions: number;
  bannedUsers: number;
  recentRegistrations: number;
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    role?: string;
    createdAt: number;
    banned?: boolean;
  }>;
  recentSessions: Array<{
    id: string;
    userId: string;
    createdAt: number;
    expiresAt: number;
    ipAddress?: string;
    userAgent?: string;
    userName?: string;
    userEmail?: string;
  }>;
}

export async function getUserStats(): Promise<UserStats> {
  const response = await fetch("/api/stats/user", {
    credentials: "include",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to load user stats");
  }
  return response.json();
}

export async function getAdminStats(): Promise<AdminStats> {
  const response = await fetch("/api/stats/admin", {
    credentials: "include",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to load admin stats");
  }
  return response.json();
}
