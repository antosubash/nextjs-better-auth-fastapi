"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { ImpersonationIndicator } from "@/components/admin/impersonation-indicator";
import { authClient } from "@/lib/auth-client";
import { ADMIN_ERRORS, ADMIN_LAYOUT, PAGE_CONTAINER, USER_ROLES } from "@/lib/constants";

/**
 * Admin Layout Component
 *
 * This layout applies ONLY to routes under /admin/* (e.g., /admin, /admin/dashboard)
 * It does NOT apply to:
 * - Login page (/)
 * - User dashboard (/dashboard)
 * - Any other routes outside /admin/*
 *
 * Next.js App Router automatically scopes layouts to their route segments.
 */

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const session = await authClient.getSession();
        const user = session?.data?.user;

        if (!user) {
          router.push("/");
          return;
        }

        if (user.role !== USER_ROLES.ADMIN) {
          setIsAuthorized(false);
        } else {
          setIsAuthorized(true);
        }
      } catch (err) {
        console.error("Failed to check admin access:", err);
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAccess();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
        <div className="text-lg text-gray-600 dark:text-gray-400">{ADMIN_LAYOUT.LOADING}</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {ADMIN_LAYOUT.ACCESS_DENIED}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{ADMIN_ERRORS.ACCESS_DENIED}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-900">
      <ImpersonationIndicator />
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-64">
        <AdminHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className={PAGE_CONTAINER.CLASS}>{children}</main>
      </div>
    </div>
  );
}
