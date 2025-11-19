"""Database reset script for FastAPI backend.

This script drops all tables in the configured database schema (default: api).
It is used to reset the database before running migrations in Docker deployments.
"""

from pathlib import Path
import sys

from sqlalchemy import text
from sqlalchemy.engine import create_engine

# Add backend directory to path for imports
backend_dir = Path(__file__).parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from core.config import DATABASE_URL_SYNC, DB_SCHEMA  # noqa: E402


def reset_database() -> None:
    """Drop all tables in the configured database schema."""
    print(f"Starting database reset for schema '{DB_SCHEMA}'...")

    try:
        # Create sync engine for reset operations
        engine = create_engine(DATABASE_URL_SYNC, echo=False)

        with engine.connect() as conn:
            # Start a transaction
            trans = conn.begin()

            try:
                # Get all table names in the schema
                query = text(
                    """
                    SELECT tablename
                    FROM pg_tables
                    WHERE schemaname = :schema_name
                    """
                )
                result = conn.execute(query, {"schema_name": DB_SCHEMA})
                tables = [row[0] for row in result]

                if not tables:
                    print(f"INFO: No tables found in schema '{DB_SCHEMA}'. Nothing to reset.")
                    trans.commit()
                    print("Database reset completed (no tables to drop)")
                    sys.exit(0)

                print(f"Found {len(tables)} table(s) to drop: {', '.join(tables)}")

                # Drop all tables with CASCADE to handle foreign key constraints
                for table in tables:
                    drop_query = text(f'DROP TABLE IF EXISTS "{DB_SCHEMA}"."{table}" CASCADE')
                    conn.execute(drop_query)
                    print(f"  Dropped table: {table}")

                # Commit the transaction
                trans.commit()

                print(f"Database reset completed successfully. Dropped {len(tables)} table(s).")
                sys.exit(0)

            except Exception:
                trans.rollback()
                raise

    except Exception as error:
        print(f"Database reset failed: {error}")
        sys.exit(1)


if __name__ == "__main__":
    reset_database()
