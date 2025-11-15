import { resolve } from "node:path";
import { config } from "dotenv";
import type { NextConfig } from "next";

// Load .env from project root directory
config({ path: resolve(__dirname, "../.env") });

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
};

export default nextConfig;
