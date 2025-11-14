import { config } from "dotenv";
import { resolve } from "node:path";
import { defineConfig } from "drizzle-kit";

// Load .env from project root directory
config({ path: resolve(__dirname, "../.env") });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Convert postgresql+asyncpg:// to postgresql:// for drizzle-kit
const databaseUrl = process.env.DATABASE_URL.replace("+asyncpg", "");

export default defineConfig({
  out: "./drizzle",
  schema: "./auth-schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
