import "dotenv/config";
import { defineConfig } from "drizzle-kit";

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
