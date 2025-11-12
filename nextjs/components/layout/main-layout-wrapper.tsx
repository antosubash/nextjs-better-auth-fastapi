"use client";

import { usePathname } from "next/navigation";
import { MainLayout } from "./main-layout";
import { OrganizationProvider } from "@/lib/contexts/organization-context";

interface MainLayoutWrapperProps {
  children: React.ReactNode;
}

export function MainLayoutWrapper({ children }: MainLayoutWrapperProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <OrganizationProvider>
      <MainLayout>{children}</MainLayout>
    </OrganizationProvider>
  );
}

