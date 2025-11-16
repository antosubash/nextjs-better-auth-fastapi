import { Geist, Geist_Mono } from "next/font/google";
import type { BrandingFonts } from "./config";

/**
 * Font loaders must be called at module scope in Next.js
 * We load the default Geist fonts here
 * Additional fonts can be added as needed, but they must be loaded at module scope
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Font mapping for CSS variable names
 * Maps font names from branding config to CSS variable names
 * Note: Only fonts loaded at module scope can be used
 */
const FONT_VARIABLE_MAP: Record<string, string> = {
  "Geist Sans": geistSans.variable,
  "Geist Mono": geistMono.variable,
  // Add more font mappings as fonts are added at module scope
  // "Inter": interFont.variable,
  // "Roboto": robotoFont.variable,
};

/**
 * Get font CSS variable for a given font name
 * Falls back to Geist if font not found
 */
function getFontVariable(fontName: string, isMono: boolean): string {
  const variable = FONT_VARIABLE_MAP[fontName];
  if (variable) {
    return variable;
  }

  // Fallback to Geist fonts
  return isMono ? geistMono.variable : geistSans.variable;
}

/**
 * Get font variables based on branding configuration
 * @param fonts - Branding fonts configuration
 * @returns Object with sans and mono font CSS variables
 */
export function getBrandingFontVariables(fonts: BrandingFonts): {
  sans: string;
  mono: string;
} {
  return {
    sans: getFontVariable(fonts.sans, false),
    mono: getFontVariable(fonts.mono, true),
  };
}

/**
 * Get font loaders for use in layout
 * Returns the actual font loader objects (for className usage)
 */
export function getBrandingFonts(): {
  sans: typeof geistSans;
  mono: typeof geistMono;
} {
  return {
    sans: geistSans,
    mono: geistMono,
  };
}
