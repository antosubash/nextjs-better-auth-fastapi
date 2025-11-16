/**
 * Branding configuration
 * Centralized branding configuration for the application
 */

export interface BrandingLogo {
  text: string;
  imageUrl: string | null;
  imageAlt: string;
}

export interface BrandingColors {
  primary: string;
  secondary: string;
  accent: string;
}

export interface BrandingFonts {
  sans: string;
  mono: string;
}

export interface BrandingMeta {
  keywords: string[];
  author: string;
  ogImage: string | null;
  twitterCard: "summary" | "summary_large_image" | "app" | "player";
}

export interface BrandingSocial {
  twitterHandle: string | null;
  facebookAppId: string | null;
}

export interface BrandingConfig {
  appName: string;
  appDescription: string;
  logo: BrandingLogo;
  colors: BrandingColors;
  fonts: BrandingFonts;
  meta: BrandingMeta;
  favicon: string;
  social: BrandingSocial;
}

// Default branding configuration
const DEFAULT_BRANDING: BrandingConfig = {
  appName: "My Website",
  appDescription:
    "Secure, fast, and easy authentication for your applications. Built with Next.js and FastAPI.",
  logo: {
    text: "My Website",
    imageUrl: null,
    imageAlt: "My Website",
  },
  colors: {
    primary: "oklch(0.21 0.034 264.665)",
    secondary: "oklch(0.967 0.003 264.542)",
    accent: "oklch(0.967 0.003 264.542)",
  },
  fonts: {
    sans: "Geist Sans",
    mono: "Geist Mono",
  },
  meta: {
    keywords: [],
    author: "",
    ogImage: null,
    twitterCard: "summary_large_image",
  },
  favicon: "/favicon.ico",
  social: {
    twitterHandle: null,
    facebookAppId: null,
  },
};

/**
 * Get branding configuration
 * Returns the default branding configuration
 */
export function branding(): BrandingConfig {
  return DEFAULT_BRANDING;
}
