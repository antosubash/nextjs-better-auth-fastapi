import { resolve } from "node:path";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

// Load .env from project root directory
config({ path: resolve(__dirname, "../../.env") });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set");
  process.exit(1);
}

// Convert postgresql+asyncpg:// to postgresql:// for postgres-js
const databaseUrl = DATABASE_URL.replace("+asyncpg", "");

async function runMigrations() {
  console.log("🔄 Starting database migrations...");

  // Create postgres connection for migrations
  const migrationClient = postgres(databaseUrl, { max: 1 });

  try {
    // Run migrations
    await migrate(drizzle(migrationClient), {
      migrationsFolder: resolve(__dirname, "../drizzle"),
    });

    console.log("✅ Database migrations completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    // Close the connection
    await migrationClient.end();
  }
}

// Run migrations
runMigrations();
