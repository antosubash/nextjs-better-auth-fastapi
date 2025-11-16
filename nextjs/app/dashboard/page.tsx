"use client";

import { Activity, Calendar, CheckCircle2, Clock, Users, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DASHBOARD, PAGE_CONTAINER, USER_ROLES } from "@/lib/constants";
import { useSession } from "@/lib/hooks/api/use-auth";
import { useUserStats } from "@/lib/hooks/api/use-stats";

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
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

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { data: stats, isLoading, error } = useUserStats();

  useEffect(() => {
    if (!session?.session) {
      router.push("/");
      return;
    }

    const userRole = session?.user?.role;
    if (userRole === USER_ROLES.ADMIN) {
      router.push("/admin/dashboard");
      return;
    }
  }, [session, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-600 dark:text-gray-400">{DASHBOARD.LOADING}</div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-600 dark:text-red-400">
            {error?.message || DASHBOARD.ERROR}
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
        <p className="text-gray-600 dark:text-gray-400">{DASHBOARD.WELCOME}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {DASHBOARD.ACTIVE_SESSIONS}
              </h3>
              <div className="p-2 rounded-lg bg-muted">
                <Users className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline">
              <p className="text-3xl font-bold">{stats.sessionsCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {DASHBOARD.ACCOUNT_CREATED}
              </h3>
              <div className="p-2 rounded-lg bg-muted">
                <Calendar className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline">
              <p className="text-3xl font-bold">{formatDate(stats.accountCreatedAt)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {DASHBOARD.EMAIL_VERIFIED}
              </h3>
              <div className="p-2 rounded-lg bg-muted">
                {stats.emailVerified ? (
                  <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <XCircle className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline">
              <p className="text-3xl font-bold">
                {stats.emailVerified ? DASHBOARD.EMAIL_VERIFIED : DASHBOARD.EMAIL_NOT_VERIFIED}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {DASHBOARD.RECENT_ACTIVITY}
              </h3>
              <div className="p-2 rounded-lg bg-muted">
                <Activity className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline">
              <p className="text-3xl font-bold">{stats.recentActivity.length}</p>
              <p className="ml-2 text-sm text-muted-foreground">items</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {stats.recentActivity.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">{DASHBOARD.NO_ACTIVITY}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivity.map((activity) => (
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
      )}
    </main>
  );
}
