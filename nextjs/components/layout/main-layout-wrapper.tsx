"use client";

import { usePathname } from "next/navigation";
import { OrganizationProvider } from "@/lib/contexts/organization-context";
import { MainLayout } from "./main-layout";

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
