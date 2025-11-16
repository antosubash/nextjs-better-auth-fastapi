"use client";

import {
  Activity,
  Calendar,
  CheckCircle2,
  Clock,
  Mail,
  Shield,
  User,
  Users,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    return DASHBOARD.TIME_JUST_NOW;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${
      diffInMinutes > 1 ? DASHBOARD.TIME_AGO_MINUTES : DASHBOARD.TIME_AGO_MINUTE
    }`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours > 1 ? DASHBOARD.TIME_AGO_HOURS : DASHBOARD.TIME_AGO_HOUR}`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays > 1 ? DASHBOARD.TIME_AGO_DAYS : DASHBOARD.TIME_AGO_DAY}`;
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
      router.push("/login");
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

  const userName = session?.user?.name || session?.user?.email?.split("@")[0] || "User";

  return (
    <main className={PAGE_CONTAINER.CLASS}>
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {DASHBOARD.WELCOME_BACK}, {userName}!
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">{DASHBOARD.ACCOUNT_OVERVIEW}</p>
      </div>

      {!stats.emailVerified && (
        <Card className="mb-6 border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50 shrink-0">
                <Mail className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                  {DASHBOARD.EMAIL_NOT_VERIFIED}
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  {DASHBOARD.VERIFY_EMAIL}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-medium">{DASHBOARD.ACTIVE_SESSIONS}</CardTitle>
                <CardDescription className="text-xs mt-1">
                  {stats.sessionsCount === 1
                    ? DASHBOARD.ACTIVE_SESSION
                    : `${stats.sessionsCount} ${DASHBOARD.ACTIVE_SESSIONS_PLURAL}`}
                </CardDescription>
              </div>
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold">{stats.sessionsCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-medium">{DASHBOARD.ACCOUNT_CREATED}</CardTitle>
                <CardDescription className="text-xs mt-1">{DASHBOARD.MEMBER_SINCE}</CardDescription>
              </div>
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{formatDate(stats.accountCreatedAt)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-medium">{DASHBOARD.EMAIL_VERIFIED}</CardTitle>
                <CardDescription className="text-xs mt-1">
                  {DASHBOARD.ACCOUNT_SECURITY}
                </CardDescription>
              </div>
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                {stats.emailVerified ? (
                  <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {stats.emailVerified ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <p className="text-lg font-semibold">{DASHBOARD.EMAIL_VERIFIED}</p>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <p className="text-lg font-semibold">{DASHBOARD.EMAIL_NOT_VERIFIED}</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{DASHBOARD.RECENT_ACTIVITY}</CardTitle>
                <CardDescription>{DASHBOARD.YOUR_RECENT_ACTIVITY}</CardDescription>
              </div>
              <div className="p-2 rounded-lg bg-muted">
                <Activity className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">{DASHBOARD.NO_ACTIVITY}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentActivity.map((activity) => (
                  <div
                    key={`${activity.type}-${activity.timestamp}`}
                    className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 border hover:bg-muted/70 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-background shrink-0">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{activity.message}</p>
                      {activity.details && (
                        <div className="mt-2 space-y-1">
                          {activity.details.ipAddress && (
                            <p className="text-xs text-muted-foreground">
                              {DASHBOARD.IP_ADDRESS}: {activity.details.ipAddress}
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
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{DASHBOARD.QUICK_ACTIONS}</CardTitle>
            <CardDescription>{DASHBOARD.COMMON_TASKS}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/profile">
                <User className="w-4 h-4 mr-2" />
                {DASHBOARD.VIEW_PROFILE}
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/dashboard/tasks">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {DASHBOARD.MANAGE_TASKS}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
