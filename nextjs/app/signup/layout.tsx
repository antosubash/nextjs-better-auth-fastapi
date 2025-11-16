import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/branding/metadata";
import { SIGNUP_PAGE } from "@/lib/constants";

export const metadata: Metadata = generatePageMetadata(SIGNUP_PAGE.TITLE, SIGNUP_PAGE.DESCRIPTION);

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
