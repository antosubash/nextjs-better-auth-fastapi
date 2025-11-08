"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { DASHBOARD, USER_ROLES, PAGE_CONTAINER } from "@/lib/constants";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { MetricsGrid } from "@/components/dashboard/metrics-grid";
import {
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
  Activity,
} from "lucide-react";

interface UserStats {
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

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkAuthAndLoadStats = async () => {
      try {
        const session = await authClient.getSession();
        if (!session?.data?.session) {
          router.push("/");
          return;
        }

        const userRole = session?.data?.user?.role;
        if (userRole === USER_ROLES.ADMIN) {
          router.push("/admin/dashboard");
          return;
        }

        setIsAuthorized(true);

        const response = await fetch("/api/stats/user", {
          credentials: "include",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || DASHBOARD.ERROR);
        }

        setStats(data);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
        setError(
          err instanceof Error ? err.message : DASHBOARD.ERROR
        );
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndLoadStats();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-600 dark:text-gray-400">
          {DASHBOARD.LOADING}
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
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
            {DASHBOARD.ERROR}
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className={PAGE_CONTAINER.CLASS}>
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {DASHBOARD.TITLE}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {DASHBOARD.WELCOME}
          </p>
        </div>

        <MetricsGrid className="mb-8">
          <StatsCard
            title={DASHBOARD.ACTIVE_SESSIONS}
            value={stats.sessionsCount}
            icon={Users}
          />
          <StatsCard
            title={DASHBOARD.ACCOUNT_CREATED}
            value={formatDate(stats.accountCreatedAt)}
            icon={Calendar}
          />
          <StatsCard
            title={DASHBOARD.EMAIL_VERIFIED}
            value={
              stats.emailVerified
                ? DASHBOARD.EMAIL_VERIFIED
                : DASHBOARD.EMAIL_NOT_VERIFIED
            }
            icon={stats.emailVerified ? CheckCircle2 : XCircle}
          />
          <StatsCard
            title={DASHBOARD.RECENT_ACTIVITY}
            value={stats.recentActivity.length}
            subtitle="items"
            icon={Activity}
          />
        </MetricsGrid>

        <ActivityFeed
          activities={stats.recentActivity}
          emptyMessage={DASHBOARD.NO_ACTIVITY}
        />
    </main>
  );
}
