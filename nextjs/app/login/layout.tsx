import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/branding/metadata";
import { LOGIN_PAGE } from "@/lib/constants";

export const metadata: Metadata = generatePageMetadata(LOGIN_PAGE.TITLE, LOGIN_PAGE.DESCRIPTION);

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
