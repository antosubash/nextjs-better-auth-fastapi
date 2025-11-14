"""add_job_history_table

Revision ID: 1ea20e3a0ec8
Revises: 75ab1b4039a6
Create Date: 2025-11-13 23:41:14.039601

"""

import sys
from collections.abc import Sequence
from pathlib import Path

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

backend_dir = Path(__file__).parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from core.config import DB_SCHEMA  # noqa: E402

# revision identifiers, used by Alembic.
revision: str = "1ea20e3a0ec8"
down_revision: str | Sequence[str] | None = "75ab1b4039a6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create schema if it doesn't exist
    op.execute(sa.text(f'CREATE SCHEMA IF NOT EXISTS "{DB_SCHEMA}"'))

    # Check if table already exists
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    table_exists = inspector.has_table("job_history", schema=DB_SCHEMA)

    if not table_exists:
        # Create job_history table
        op.create_table(
            "job_history",
            sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("job_id", sa.String(length=255), nullable=False),
            sa.Column("function", sa.String(length=500), nullable=False),
            sa.Column("func_ref", sa.String(length=500), nullable=False),
            sa.Column("trigger", sa.String(length=500), nullable=False),
            sa.Column("trigger_type", sa.String(length=50), nullable=False),
            sa.Column(
                "status",
                sa.String(length=20),
                nullable=False,
                server_default="created",
            ),
            sa.Column("args", postgresql.JSON(astext_type=sa.Text()), nullable=True),
            sa.Column("kwargs", postgresql.JSON(astext_type=sa.Text()), nullable=True),
            sa.Column("next_run_time", postgresql.TIMESTAMP(timezone=True), nullable=True),
            sa.Column("error_message", sa.Text(), nullable=True),
            sa.Column("user_id", sa.String(), nullable=True),
            sa.Column(
                "created_at",
                postgresql.TIMESTAMP(timezone=True),
                nullable=False,
                server_default=sa.func.now(),
            ),
            sa.PrimaryKeyConstraint("id", name=op.f("job_history_pkey")),
            schema=DB_SCHEMA,
        )

    # Check and create indexes if they don't exist (only if table exists)
    if table_exists:
        indexes = inspector.get_indexes("job_history", schema=DB_SCHEMA)
        index_names = {idx["name"] for idx in indexes}

        if op.f("ix_api_job_history_job_id") not in index_names:
            op.create_index(
                op.f("ix_api_job_history_job_id"),
                "job_history",
                ["job_id"],
                unique=False,
                schema=DB_SCHEMA,
            )

        if op.f("ix_api_job_history_user_id") not in index_names:
            op.create_index(
                op.f("ix_api_job_history_user_id"),
                "job_history",
                ["user_id"],
                unique=False,
                schema=DB_SCHEMA,
            )
    else:
        # If table was just created, create indexes
        op.create_index(
            op.f("ix_api_job_history_job_id"),
            "job_history",
            ["job_id"],
            unique=False,
            schema=DB_SCHEMA,
        )
        op.create_index(
            op.f("ix_api_job_history_user_id"),
            "job_history",
            ["user_id"],
            unique=False,
            schema=DB_SCHEMA,
        )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_api_job_history_user_id"), table_name="job_history", schema=DB_SCHEMA)
    op.drop_index(op.f("ix_api_job_history_job_id"), table_name="job_history", schema=DB_SCHEMA)
    op.drop_table("job_history", schema=DB_SCHEMA)
