import type { Metadata } from "next";
import { BrandingStyles } from "@/components/branding/branding-styles";
import { generatePageMetadata } from "@/lib/branding/metadata";
import { ADMIN_DASHBOARD } from "@/lib/constants";
import { AdminLayoutClient } from "./layout-client";

export const metadata: Metadata = generatePageMetadata(
  ADMIN_DASHBOARD.TITLE,
  ADMIN_DASHBOARD.WELCOME
);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BrandingStyles />
      <AdminLayoutClient>{children}</AdminLayoutClient>
    </>
  );
}
