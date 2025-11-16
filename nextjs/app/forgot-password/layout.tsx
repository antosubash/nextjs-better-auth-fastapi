import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/branding/metadata";
import { FORGOT_PASSWORD } from "@/lib/constants";

export const metadata: Metadata = generatePageMetadata(
  FORGOT_PASSWORD.TITLE,
  FORGOT_PASSWORD.DESCRIPTION
);

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
