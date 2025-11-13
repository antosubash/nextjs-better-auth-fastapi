import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Convert postgresql+asyncpg:// to postgresql:// for the postgres package
const databaseUrl = process.env.DATABASE_URL.replace("+asyncpg", "");

const client = postgres(databaseUrl);

export const db = drizzle(client);
