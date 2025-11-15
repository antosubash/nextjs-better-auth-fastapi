import { resolve } from "node:path";
import { config } from "dotenv";
import type { NextConfig } from "next";

// Load .env from project root directory
config({ path: resolve(__dirname, "../.env") });

// Security headers configuration
const securityHeadersEnabled = process.env.NEXT_PUBLIC_SECURITY_HEADERS_ENABLED !== "false";
const hstsMaxAge = parseInt(process.env.NEXT_PUBLIC_HSTS_MAX_AGE || "31536000", 10); // 1 year default
const cspPolicy =
  process.env.NEXT_PUBLIC_CSP_POLICY ||
  "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self';";
const permissionsPolicy =
  process.env.NEXT_PUBLIC_PERMISSIONS_POLICY ||
  "geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=()";

// Extract MinIO hostname from environment
const minioEndpoint = process.env.MINIO_ENDPOINT || "localhost:9000";
const minioUseSsl = process.env.MINIO_USE_SSL === "true";
const minioHostname = minioEndpoint.split(":")[0];
const minioPortStr = minioEndpoint.includes(":") ? minioEndpoint.split(":")[1] : undefined;
const minioPort = minioPortStr ? parseInt(minioPortStr, 10) : minioUseSsl ? 443 : 80;

// Build remote pattern - only include port if it's non-standard
const remotePattern: {
  protocol: "http" | "https";
  hostname: string;
  port?: string;
  pathname: string;
} = {
  protocol: minioUseSsl ? "https" : "http",
  hostname: minioHostname,
  pathname: "/**",
};

// Only include port if it's non-standard (not 80 for http, not 443 for https)
if (minioPort && minioPort !== (minioUseSsl ? 443 : 80)) {
  remotePattern.port = minioPortStr;
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [remotePattern],
  },
  async headers() {
    if (!securityHeadersEnabled) {
      return [];
    }

    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          ...(hstsMaxAge > 0
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: `max-age=${hstsMaxAge}; includeSubDomains`,
                },
              ]
            : []),
          ...(cspPolicy
            ? [
                {
                  key: "Content-Security-Policy",
                  value: cspPolicy,
                },
              ]
            : []),
          ...(permissionsPolicy
            ? [
                {
                  key: "Permissions-Policy",
                  value: permissionsPolicy,
                },
              ]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
