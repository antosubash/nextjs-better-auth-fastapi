import type { Metadata } from "next";
import { branding } from "./config";

/**
 * Generate page metadata with branding information
 * @param title - Page-specific title (will be combined with app name)
 * @param description - Optional page-specific description (defaults to app description)
 * @returns Metadata object for Next.js
 */
export function generatePageMetadata(title: string, description?: string): Metadata {
  const brand = branding();

  const metadata: Metadata = {
    title: `${brand.appName} - ${title}`,
    description: description || brand.appDescription,
    icons: {
      icon: brand.favicon,
    },
  };

  // Add keywords if provided
  if (brand.meta.keywords.length > 0) {
    metadata.keywords = brand.meta.keywords;
  }

  // Add author if provided
  if (brand.meta.author) {
    metadata.authors = [{ name: brand.meta.author }];
  }

  // Open Graph metadata
  metadata.openGraph = {
    title: `${brand.appName} - ${title}`,
    description: description || brand.appDescription,
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
  };

  // Twitter Card metadata
  metadata.twitter = {
    card: brand.meta.twitterCard,
    title: `${brand.appName} - ${title}`,
    description: description || brand.appDescription,
    ...(brand.meta.ogImage && {
      images: [brand.meta.ogImage],
    }),
    ...(brand.social.twitterHandle && {
      creator: `@${brand.social.twitterHandle}`,
      site: `@${brand.social.twitterHandle}`,
    }),
  };

  // Add Facebook App ID if provided
  if (brand.social.facebookAppId) {
    metadata.other = {
      "fb:app_id": brand.social.facebookAppId,
    };
  }

  return metadata;
}
