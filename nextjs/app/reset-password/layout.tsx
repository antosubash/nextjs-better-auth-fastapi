import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/branding/metadata";
import { RESET_PASSWORD } from "@/lib/constants";

export const metadata: Metadata = generatePageMetadata(
  RESET_PASSWORD.TITLE,
  RESET_PASSWORD.DESCRIPTION
);

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
