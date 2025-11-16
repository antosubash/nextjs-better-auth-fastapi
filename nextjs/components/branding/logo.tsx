"use client";

import Image from "next/image";
import Link from "next/link";
import { BRANDING } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

const sizeClasses = {
  sm: "h-6",
  md: "h-8",
  lg: "h-10",
  xl: "h-12",
};

const textSizeClasses = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
  xl: "text-3xl",
};

const getImageSize = (size: LogoProps["size"]): number => {
  switch (size) {
    case "sm":
      return 24;
    case "lg":
      return 40;
    case "xl":
      return 48;
    default:
      return 32;
  }
};

const renderLogoContent = (
  logo: { text: string; imageUrl: string | null; imageAlt: string },
  size: LogoProps["size"],
  showText: boolean
) => {
  const imageSize = getImageSize(size);
  const sizeKey = size || "md";
  const textElement = showText ? (
    <span className={cn("font-bold", textSizeClasses[sizeKey])}>{logo.text}</span>
  ) : null;

  if (logo.imageUrl) {
    return (
      <>
        <Image
          src={logo.imageUrl}
          alt={logo.imageAlt}
          width={imageSize}
          height={imageSize}
          className={cn(sizeClasses[sizeKey], "w-auto")}
          priority
        />
        {textElement}
      </>
    );
  }

  return textElement;
};

export function Logo({ className, size = "md", showText = true }: LogoProps) {
  const logo = BRANDING.logo;

  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2 hover:opacity-80 transition-opacity", className)}
    >
      {renderLogoContent(logo, size, showText)}
    </Link>
  );
}
