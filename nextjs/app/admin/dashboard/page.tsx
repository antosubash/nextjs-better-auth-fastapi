"use client";

import { useState, useEffect } from "react";
import { ADMIN_DASHBOARD } from "@/lib/constants";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { MetricsGrid } from "@/components/dashboard/metrics-grid";
import { Users, Activity, Ban, UserPlus, Link as LinkIcon } from "lucide-react";
import Link from "next/link";

interface AdminStats {
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
  return activities
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10);
}

export default function AdminDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch("/api/stats/admin", {
          credentials: "include",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || ADMIN_DASHBOARD.ERROR);
        }

        setStats(data);
      } catch (err) {
        console.error("Failed to load admin dashboard:", err);
        setError(
          err instanceof Error ? err.message : ADMIN_DASHBOARD.ERROR
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-600 dark:text-gray-400">
          {ADMIN_DASHBOARD.LOADING}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-600 dark:text-red-400">
            {ADMIN_DASHBOARD.ERROR}
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
            <p className="text-gray-600 dark:text-gray-400">
              {ADMIN_DASHBOARD.WELCOME}
            </p>
          </div>
          <Link
            href="/admin"
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
          >
            {ADMIN_DASHBOARD.VIEW_ALL_USERS}
          </Link>
        </div>

        <MetricsGrid className="mb-8">
          <StatsCard
            title={ADMIN_DASHBOARD.TOTAL_USERS}
            value={stats.totalUsers}
            icon={Users}
          />
          <StatsCard
            title={ADMIN_DASHBOARD.ACTIVE_SESSIONS}
            value={stats.activeSessions}
            icon={Activity}
          />
          <StatsCard
            title={ADMIN_DASHBOARD.BANNED_USERS}
            value={stats.bannedUsers}
            icon={Ban}
          />
          <StatsCard
            title={ADMIN_DASHBOARD.RECENT_REGISTRATIONS}
            value={stats.recentRegistrations}
            subtitle={ADMIN_DASHBOARD.RECENT_REGISTRATIONS_SUBTITLE}
            icon={UserPlus}
          />
        </MetricsGrid>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {ADMIN_DASHBOARD.RECENT_USERS}
              </h3>
              <Link
                href="/admin"
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
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user.email}
                      </p>
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

        <ActivityFeed
          activities={formatActivityItems(stats.recentUsers, stats.recentSessions)}
          emptyMessage={ADMIN_DASHBOARD.NO_SESSIONS}
        />
    </>
  );
}
