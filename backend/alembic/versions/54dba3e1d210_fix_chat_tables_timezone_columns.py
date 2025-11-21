"""fix_chat_tables_timezone_columns

Revision ID: 54dba3e1d210
Revises: 6267d9a6a5fb
Create Date: 2025-11-21 22:36:02.798674

"""

from collections.abc import Sequence
from pathlib import Path
import sys
from typing import Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

backend_dir = Path(__file__).parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from core.config import DB_SCHEMA  # noqa: E402

# revision identifiers, used by Alembic.
revision: str = "54dba3e1d210"
down_revision: Union[str, Sequence[str], None] = "6267d9a6a5fb"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Alter chat_conversations.created_at to TIMESTAMP WITH TIME ZONE
    # Convert existing data assuming UTC timezone
    op.execute(
        sa.text(
            f'ALTER TABLE "{DB_SCHEMA}".chat_conversations '
            "ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE "
            "USING created_at AT TIME ZONE 'UTC'"
        )
    )
    op.execute(
        sa.text(
            f'ALTER TABLE "{DB_SCHEMA}".chat_conversations '
            "ALTER COLUMN created_at SET DEFAULT now()"
        )
    )

    # Alter chat_conversations.updated_at to TIMESTAMP WITH TIME ZONE
    op.execute(
        sa.text(
            f'ALTER TABLE "{DB_SCHEMA}".chat_conversations '
            "ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE "
            "USING updated_at AT TIME ZONE 'UTC'"
        )
    )
    op.execute(
        sa.text(
            f'ALTER TABLE "{DB_SCHEMA}".chat_conversations '
            "ALTER COLUMN updated_at SET DEFAULT now()"
        )
    )

    # Alter chat_messages.created_at to TIMESTAMP WITH TIME ZONE
    op.execute(
        sa.text(
            f'ALTER TABLE "{DB_SCHEMA}".chat_messages '
            "ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE "
            "USING created_at AT TIME ZONE 'UTC'"
        )
    )
    op.execute(
        sa.text(
            f'ALTER TABLE "{DB_SCHEMA}".chat_messages ALTER COLUMN created_at SET DEFAULT now()'
        )
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Convert back to TIMESTAMP WITHOUT TIME ZONE
    # Note: This will lose timezone information
    op.execute(
        sa.text(
            f'ALTER TABLE "{DB_SCHEMA}".chat_conversations '
            "ALTER COLUMN created_at TYPE TIMESTAMP WITHOUT TIME ZONE "
            "USING created_at AT TIME ZONE 'UTC'"
        )
    )
    op.execute(
        sa.text(
            f'ALTER TABLE "{DB_SCHEMA}".chat_conversations ALTER COLUMN created_at DROP DEFAULT'
        )
    )

    op.execute(
        sa.text(
            f'ALTER TABLE "{DB_SCHEMA}".chat_conversations '
            "ALTER COLUMN updated_at TYPE TIMESTAMP WITHOUT TIME ZONE "
            "USING updated_at AT TIME ZONE 'UTC'"
        )
    )
    op.execute(
        sa.text(
            f'ALTER TABLE "{DB_SCHEMA}".chat_conversations ALTER COLUMN updated_at DROP DEFAULT'
        )
    )

    op.execute(
        sa.text(
            f'ALTER TABLE "{DB_SCHEMA}".chat_messages '
            "ALTER COLUMN created_at TYPE TIMESTAMP WITHOUT TIME ZONE "
            "USING created_at AT TIME ZONE 'UTC'"
        )
    )
    op.execute(
        sa.text(f'ALTER TABLE "{DB_SCHEMA}".chat_messages ALTER COLUMN created_at DROP DEFAULT')
    )
