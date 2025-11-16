import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/branding/metadata";
import { DASHBOARD } from "@/lib/constants";
import { DashboardLayoutClient } from "./layout-client";

export const metadata: Metadata = generatePageMetadata(DASHBOARD.TITLE, DASHBOARD.WELCOME);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
