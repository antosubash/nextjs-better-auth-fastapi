"use client";

import { Activity, Ban, Clock, Link as LinkIcon, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ADMIN_DASHBOARD } from "@/lib/constants";
import { useAdminStats } from "@/lib/hooks/api/use-stats";

function formatActivityItems(
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    createdAt: number;
  }>,
  recentSessions: Array<{
    id: string;
    createdAt: number;
    userName?: string;
    userEmail?: string;
    ipAddress?: string;
    userAgent?: string;
  }>
) {
  const activities: Array<{
    type: string;
    message: string;
    timestamp: number;
    details?: {
      [key: string]: string | undefined;
    };
  }> = [];

  // Add recent user registrations
  recentUsers.forEach((user) => {
    activities.push({
      type: "user",
      message: `${ADMIN_DASHBOARD.NEW_USER}: ${user.name} (${user.email})`,
      timestamp: user.createdAt,
      details: {
        email: user.email,
      },
    });
  });

  // Add recent sessions
  recentSessions.forEach((session) => {
    activities.push({
      type: "session",
      message: `${ADMIN_DASHBOARD.NEW_SESSION}: ${session.userName || session.userEmail}`,
      timestamp: session.createdAt,
      details: {
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
      },
    });
  });

  // Sort by timestamp descending and limit to 10
  return activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading, error } = useAdminStats();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-600 dark:text-gray-400">{ADMIN_DASHBOARD.LOADING}</div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-600 dark:text-red-400">
            {error?.message || ADMIN_DASHBOARD.ERROR}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {ADMIN_DASHBOARD.TITLE}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{ADMIN_DASHBOARD.WELCOME}</p>
        </div>
        <Link
          href="/admin/users"
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
        >
          {ADMIN_DASHBOARD.VIEW_ALL_USERS}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {ADMIN_DASHBOARD.TOTAL_USERS}
              </h3>
              <div className="p-2 rounded-lg bg-muted">
                <Users className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline">
              <p className="text-3xl font-bold">{stats.totalUsers}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {ADMIN_DASHBOARD.ACTIVE_SESSIONS}
              </h3>
              <div className="p-2 rounded-lg bg-muted">
                <Activity className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline">
              <p className="text-3xl font-bold">{stats.activeSessions}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {ADMIN_DASHBOARD.BANNED_USERS}
              </h3>
              <div className="p-2 rounded-lg bg-muted">
                <Ban className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline">
              <p className="text-3xl font-bold">{stats.bannedUsers}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {ADMIN_DASHBOARD.RECENT_REGISTRATIONS}
              </h3>
              <div className="p-2 rounded-lg bg-muted">
                <UserPlus className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline">
              <p className="text-3xl font-bold">{stats.recentRegistrations}</p>
              <p className="ml-2 text-sm text-muted-foreground">
                {ADMIN_DASHBOARD.RECENT_REGISTRATIONS_SUBTITLE}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {ADMIN_DASHBOARD.RECENT_USERS}
            </h3>
            <Link
              href="/admin/users"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              {ADMIN_DASHBOARD.VIEW_ALL_USERS} →
            </Link>
          </div>
          {stats.recentUsers.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              {ADMIN_DASHBOARD.NO_USERS}
            </p>
          ) : (
            <div className="space-y-3">
              {stats.recentUsers.slice(0, 5).map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                      {user.role || "user"}
                    </span>
                    {user.banned && (
                      <span className="ml-2 text-xs px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
                        Banned
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {ADMIN_DASHBOARD.RECENT_SESSIONS}
          </h3>
          {stats.recentSessions.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              {ADMIN_DASHBOARD.NO_SESSIONS}
            </p>
          ) : (
            <div className="space-y-3">
              {stats.recentSessions.slice(0, 5).map((session) => (
                <div
                  key={session.id}
                  className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <LinkIcon className="w-4 h-4 text-gray-400" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {session.userName || session.userEmail}
                    </p>
                  </div>
                  {session.ipAddress && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      IP: {session.ipAddress}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {new Date(session.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {(() => {
        const activities = formatActivityItems(stats.recentUsers, stats.recentSessions);
        return activities.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">{ADMIN_DASHBOARD.NO_SESSIONS}</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div
                    key={`${activity.type}-${activity.timestamp}`}
                    className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 border"
                  >
                    <div className="p-2 rounded-lg bg-muted">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.message}</p>
                      {activity.details && (
                        <div className="mt-1 space-y-1">
                          {activity.details.ipAddress && (
                            <p className="text-xs text-muted-foreground">
                              IP: {activity.details.ipAddress}
                            </p>
                          )}
                          {activity.details.userAgent && (
                            <p className="text-xs text-muted-foreground truncate">
                              {activity.details.userAgent}
                            </p>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatTimestamp(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })()}
    </>
  );
}
