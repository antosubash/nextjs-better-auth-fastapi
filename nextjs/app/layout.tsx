import type { Metadata } from "next";
import "./globals.css";
import { BrandingStyles } from "@/components/branding/branding-styles";
import { MainLayoutWrapper } from "@/components/layout/main-layout-wrapper";
import { Toaster } from "@/components/ui/sonner";
import { branding } from "@/lib/branding/config";
import { getBrandingFonts, getBrandingFontVariables } from "@/lib/branding/fonts";
import { QueryProvider } from "@/lib/providers/query-provider";

// Load fonts at module scope (required by Next.js)
getBrandingFonts();

// Get font variables based on branding configuration
const brand = branding();
const fontVariables = getBrandingFontVariables(brand.fonts);

// Root layout metadata - just use app name without suffix
export const metadata: Metadata = {
  title: brand.appName,
  description: brand.appDescription,
  icons: {
    icon: brand.favicon,
  },
  ...(brand.meta.keywords.length > 0 && { keywords: brand.meta.keywords }),
  ...(brand.meta.author && { authors: [{ name: brand.meta.author }] }),
  openGraph: {
    title: brand.appName,
    description: brand.appDescription,
    type: "website",
    ...(brand.meta.ogImage && {
      images: [
        {
          url: brand.meta.ogImage,
          width: 1200,
          height: 630,
          alt: brand.appName,
        },
      ],
    }),
  },
  twitter: {
    card: brand.meta.twitterCard,
    title: brand.appName,
    description: brand.appDescription,
    ...(brand.meta.ogImage && { images: [brand.meta.ogImage] }),
    ...(brand.social.twitterHandle && {
      creator: `@${brand.social.twitterHandle}`,
      site: `@${brand.social.twitterHandle}`,
    }),
  },
  ...(brand.social.facebookAppId && {
    other: {
      "fb:app_id": brand.social.facebookAppId,
    },
  }),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${fontVariables.sans} ${fontVariables.mono} antialiased`}>
        <BrandingStyles />
        <QueryProvider>
          <MainLayoutWrapper>{children}</MainLayoutWrapper>
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
