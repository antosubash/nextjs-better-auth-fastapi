"use client";

import { usePathname } from "next/navigation";
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

  return <MainLayout>{children}</MainLayout>;
}

