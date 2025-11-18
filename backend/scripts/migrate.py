"""Database migration script for FastAPI backend.

This script runs Alembic migrations programmatically with enhanced error handling
and logging. It provides better visibility into the migration process and ensures
consistent behavior across different deployment environments.
"""

import sys
from pathlib import Path

from alembic import command
from alembic.config import Config


def run_migrations() -> None:
    """Run database migrations using Alembic programmatic API."""
    print("🔄 Starting backend database migrations...")

    try:
        # Get the backend directory (parent of scripts directory)
        backend_dir = Path(__file__).parent.parent

        # Create Alembic config
        alembic_ini_path = backend_dir / "alembic.ini"

        if not alembic_ini_path.exists():
            print(f"❌ Alembic configuration file not found: {alembic_ini_path}")
            sys.exit(1)

        # Load Alembic configuration
        alembic_cfg = Config(str(alembic_ini_path))

        # Set the script location to the alembic directory
        alembic_cfg.set_main_option("script_location", str(backend_dir / "alembic"))

        # Run migrations to head
        command.upgrade(alembic_cfg, "head")

        print("✅ Backend database migrations completed successfully")
        sys.exit(0)

    except Exception as error:
        print(f"❌ Migration failed: {error}")
        sys.exit(1)


if __name__ == "__main__":
    run_migrations()
