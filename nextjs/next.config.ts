import { resolve } from "node:path";
import { config } from "dotenv";
import type { NextConfig } from "next";

// Load .env from project root directory
config({ path: resolve(__dirname, "../.env") });

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
