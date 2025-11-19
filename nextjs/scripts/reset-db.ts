// Load .env from project root directory BEFORE any imports
import { resolve } from "node:path";
import { config } from "dotenv";
import postgres from "postgres";

// This must execute before any other imports that depend on env vars
config({ path: resolve(__dirname, "../../.env") });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set");
  process.exit(1);
}

// Convert postgresql+asyncpg:// to postgresql:// for postgres-js
const databaseUrl = DATABASE_URL.replace("+asyncpg", "");

// Better Auth tables to drop (in public schema)
const BETTER_AUTH_TABLES = [
  "account",
  "apikey",
  "invitation",
  "jwks",
  "member",
  "organization",
  "passkey",
  "session",
  "team",
  "team_member",
  "user",
  "verification",
];

async function resetDatabase() {
  console.log("🔄 Starting database reset for Better Auth tables...");

  // Create postgres connection for reset operations
  const resetClient = postgres(databaseUrl, { max: 1 });

  try {
    // Get all existing tables from the list
    const existingTables: string[] = [];

    for (const table of BETTER_AUTH_TABLES) {
      const result = await resetClient`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = ${table}
        )
      `;

      if (result[0]?.exists) {
        existingTables.push(table);
      }
    }

    if (existingTables.length === 0) {
      console.log("ℹ️  No Better Auth tables found. Nothing to reset.");
      console.log("✅ Database reset completed (no tables to drop)");
      process.exit(0);
    }

    console.log(`📋 Found ${existingTables.length} table(s) to drop: ${existingTables.join(", ")}`);

    // Drop all tables with CASCADE to handle foreign key constraints
    for (const table of existingTables) {
      await resetClient.unsafe(`DROP TABLE IF EXISTS "${table}" CASCADE`);
      console.log(`  ✓ Dropped table: ${table}`);
    }

    console.log(
      `✅ Database reset completed successfully. Dropped ${existingTables.length} table(s).`
    );
    process.exit(0);
  } catch (error) {
    console.error("❌ Database reset failed:", error);
    process.exit(1);
  } finally {
    // Close the connection
    await resetClient.end();
  }
}

// Run reset
resetDatabase();
