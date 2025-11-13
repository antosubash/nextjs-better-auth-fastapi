"""fix_job_history_timezone_columns

Revision ID: dcd897e70fd9
Revises: 1ea20e3a0ec8
Create Date: 2025-11-13 23:45:00.000000

"""

import sys
from collections.abc import Sequence
from pathlib import Path
from typing import Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

backend_dir = Path(__file__).parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from core.config import DB_SCHEMA  # noqa: E402

# revision identifiers, used by Alembic.
revision: str = "dcd897e70fd9"
down_revision: Union[str, Sequence[str], None] = "1ea20e3a0ec8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Alter next_run_time column to TIMESTAMP WITH TIME ZONE
    op.execute(
        sa.text(
            f'ALTER TABLE "{DB_SCHEMA}".job_history '
            "ALTER COLUMN next_run_time TYPE TIMESTAMP WITH TIME ZONE "
            "USING next_run_time AT TIME ZONE 'UTC'"
        )
    )

    # Alter created_at column to TIMESTAMP WITH TIME ZONE
    op.execute(
        sa.text(
            f'ALTER TABLE "{DB_SCHEMA}".job_history '
            "ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE "
            "USING created_at AT TIME ZONE 'UTC'"
        )
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Alter next_run_time column back to TIMESTAMP WITHOUT TIME ZONE
    op.execute(
        sa.text(
            f'ALTER TABLE "{DB_SCHEMA}".job_history '
            "ALTER COLUMN next_run_time TYPE TIMESTAMP WITHOUT TIME ZONE "
            "USING next_run_time AT TIME ZONE 'UTC'"
        )
    )

    # Alter created_at column back to TIMESTAMP WITHOUT TIME ZONE
    op.execute(
        sa.text(
            f'ALTER TABLE "{DB_SCHEMA}".job_history '
            "ALTER COLUMN created_at TYPE TIMESTAMP WITHOUT TIME ZONE "
            "USING created_at AT TIME ZONE 'UTC'"
        )
    )
