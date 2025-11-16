"""create_tasks_table

Revision ID: 75ab1b4039a6
Revises:
Create Date: 2025-11-13 20:45:12.231782

"""

# Import DB_SCHEMA from config
from collections.abc import Sequence
from pathlib import Path
import sys

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

backend_dir = Path(__file__).parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from core.config import DB_SCHEMA  # noqa: E402

# revision identifiers, used by Alembic.
revision: str = "75ab1b4039a6"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create schema if it doesn't exist
    op.execute(sa.text(f'CREATE SCHEMA IF NOT EXISTS "{DB_SCHEMA}"'))

    op.create_table(
        "tasks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.String(length=5000), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        schema=DB_SCHEMA,
    )
    op.create_index("ix_tasks_user_id", "tasks", ["user_id"], schema=DB_SCHEMA)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_tasks_user_id", table_name="tasks", schema=DB_SCHEMA)
    op.drop_table("tasks", schema=DB_SCHEMA)
