"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { UserHeader } from "@/components/user/user-header";
import { UserSidebar } from "@/components/user/user-sidebar";
import { PAGE_CONTAINER, USER_LAYOUT, USER_ROLES } from "@/lib/constants";
import { useSession } from "@/lib/hooks/api/use-auth";

/**
 * Dashboard Layout Client Component
 *
 * This layout applies ONLY to routes under /dashboard/* (e.g., /dashboard, /dashboard/tasks)
 * It does NOT apply to:
 * - Landing page (/)
 * - Login/Signup pages (/login, /signup)
 * - Admin pages (/admin/*)
 * - Any other routes outside /dashboard/*
 *
 * Next.js App Router automatically scopes layouts to their route segments.
 */

export function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, isLoading } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const user = session?.user;
  const isAuthenticated = !!user;

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
        return;
      }

      // Redirect admin users to admin dashboard
      if (user.role === USER_ROLES.ADMIN) {
        router.push("/admin/dashboard");
        return;
      }
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
        <div className="text-lg text-gray-600 dark:text-gray-400">{USER_LAYOUT.LOADING}</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {USER_LAYOUT.ACCESS_DENIED}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{USER_LAYOUT.LOGIN_REQUIRED}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-900">
      <UserSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-64">
        <UserHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className={PAGE_CONTAINER.CLASS}>{children}</main>
      </div>
    </div>
  );
}
