import type { NextConfig } from "next";
import { config } from "dotenv";
import { resolve } from "node:path";

// Load .env from project root directory
config({ path: resolve(__dirname, "../.env") });

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
