"""add_logs_to_job_history

Revision ID: 580d10c44d94
Revises: dcd897e70fd9
Create Date: 2025-11-14 11:19:03.206692

"""
import sys
from collections.abc import Sequence
from pathlib import Path
from typing import Union

import sqlalchemy as sa
from alembic import op

backend_dir = Path(__file__).parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from core.config import DB_SCHEMA  # noqa: E402

# revision identifiers, used by Alembic.
revision: str = "580d10c44d94"
down_revision: Union[str, Sequence[str], None] = "dcd897e70fd9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add logs column to job_history table
    op.add_column(
        "job_history",
        sa.Column("logs", sa.Text(), nullable=True),
        schema=DB_SCHEMA,
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Remove logs column from job_history table
    op.drop_column("job_history", "logs", schema=DB_SCHEMA)
