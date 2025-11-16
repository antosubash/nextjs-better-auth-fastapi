"use client";

import { useEffect } from "react";
import { BRANDING } from "@/lib/constants";

/**
 * Component that injects branding colors as CSS custom properties
 * This allows dynamic color customization from the branding config
 */
export function BrandingStyles() {
  useEffect(() => {
    const colors = BRANDING.colors;

    // Set CSS custom properties for branding colors
    const root = document.documentElement;
    root.style.setProperty("--branding-primary", colors.primary);
    root.style.setProperty("--branding-secondary", colors.secondary);
    root.style.setProperty("--branding-accent", colors.accent);
  }, []);

  return null;
}
