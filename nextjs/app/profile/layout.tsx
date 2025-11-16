"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { UserHeader } from "@/components/user/user-header";
import { UserSidebar } from "@/components/user/user-sidebar";
import { PAGE_CONTAINER, USER_LAYOUT, USER_ROLES } from "@/lib/constants";
import { useSession } from "@/lib/hooks/api/use-auth";

/**
 * Profile Layout Component
 *
 * This layout applies to the /profile route and provides the same
 * navigation structure as the dashboard layout for consistency.
 */

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
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

  const isAdmin = user?.role === USER_ROLES.ADMIN;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-900">
      {isAdmin ? (
        <>
          <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className="lg:pl-64">
            <AdminHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
            <main className={PAGE_CONTAINER.CLASS}>{children}</main>
          </div>
        </>
      ) : (
        <>
          <UserSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className="lg:pl-64">
            <UserHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
            <main className={PAGE_CONTAINER.CLASS}>{children}</main>
          </div>
        </>
      )}
    </div>
  );
}
