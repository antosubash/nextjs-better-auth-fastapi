import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/branding/metadata";
import { AUTH_LABELS } from "@/lib/constants";
import { ProfileLayoutClient } from "./layout-client";

export const metadata: Metadata = generatePageMetadata(AUTH_LABELS.PROFILE);

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <ProfileLayoutClient>{children}</ProfileLayoutClient>;
}
