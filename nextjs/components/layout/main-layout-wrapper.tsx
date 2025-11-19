"use client";

import { usePathname } from "next/navigation";
import { OrganizationProvider } from "@/lib/providers/organization-provider";
import { MainLayout } from "./main-layout";

interface MainLayoutWrapperProps {
  children: React.ReactNode;
}

export function MainLayoutWrapper({ children }: MainLayoutWrapperProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");
  const isDashboardRoute = pathname?.startsWith("/dashboard");
  const isProfileRoute = pathname === "/profile";

  // Exclude admin, dashboard, and profile routes from MainLayout
  // These routes have their own layouts with custom navigation
  if (isAdminRoute || isDashboardRoute || isProfileRoute) {
    return <>{children}</>;
  }

  return (
    <OrganizationProvider>
      <MainLayout>{children}</MainLayout>
    </OrganizationProvider>
  );
}
