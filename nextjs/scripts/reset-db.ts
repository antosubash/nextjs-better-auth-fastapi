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

// Migration tables to drop (in drizzle schema)
const DRIZZLE_MIGRATION_TABLE = "__drizzle_migrations";
const DRIZZLE_SCHEMA = "drizzle";

async function resetDatabase() {
  console.log("🔄 Starting database reset for Better Auth tables and migration tables...");

  // Create postgres connection for reset operations
  const resetClient = postgres(databaseUrl, { max: 1 });

  try {
    // Get all existing Better Auth tables from public schema
    const existingTables: Array<{ schema: string; table: string }> = [];

    for (const table of BETTER_AUTH_TABLES) {
      const result = await resetClient`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = ${table}
        )
      `;

      if (result[0]?.exists) {
        existingTables.push({ schema: "public", table });
      }
    }

    // Check for Drizzle migration table in drizzle schema
    const drizzleMigrationResult = await resetClient`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = ${DRIZZLE_SCHEMA}
        AND table_name = ${DRIZZLE_MIGRATION_TABLE}
      )
    `;

    if (drizzleMigrationResult[0]?.exists) {
      existingTables.push({ schema: DRIZZLE_SCHEMA, table: DRIZZLE_MIGRATION_TABLE });
    }

    if (existingTables.length === 0) {
      console.log("ℹ️  No Better Auth or migration tables found. Nothing to reset.");
      console.log("✅ Database reset completed (no tables to drop)");
      await resetClient.end();
      process.exit(0);
    }

    const tableNames = existingTables.map((t) => `${t.schema}.${t.table}`).join(", ");
    console.log(`📋 Found ${existingTables.length} table(s) to drop: ${tableNames}`);

    // Drop all tables with CASCADE to handle foreign key constraints
    for (const { schema, table } of existingTables) {
      await resetClient.unsafe(`DROP TABLE IF EXISTS "${schema}"."${table}" CASCADE`);
      console.log(`  ✓ Dropped table: ${schema}.${table}`);
    }

    console.log(
      `✅ Database reset completed successfully. Dropped ${existingTables.length} table(s).`
    );
    await resetClient.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Database reset failed:", error);
    await resetClient.end();
    process.exit(1);
  }
}

// Run reset
resetDatabase();
