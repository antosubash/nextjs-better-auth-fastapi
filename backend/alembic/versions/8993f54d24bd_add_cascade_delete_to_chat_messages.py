"""add_cascade_delete_to_chat_messages

Revision ID: 8993f54d24bd
Revises: 54dba3e1d210
Create Date: 2025-11-21 22:41:26.952997

"""

from collections.abc import Sequence
from pathlib import Path
import sys

from alembic import op

backend_dir = Path(__file__).parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from core.config import DB_SCHEMA  # noqa: E402

# revision identifiers, used by Alembic.
revision: str = "8993f54d24bd"
down_revision: str | Sequence[str] | None = "54dba3e1d210"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    # Drop existing foreign key constraint
    op.drop_constraint(
        "chat_messages_conversation_id_fkey",
        "chat_messages",
        schema=DB_SCHEMA,
        type_="foreignkey",
    )

    # Recreate foreign key constraint with CASCADE delete
    op.create_foreign_key(
        "chat_messages_conversation_id_fkey",
        "chat_messages",
        "chat_conversations",
        ["conversation_id"],
        ["id"],
        ondelete="CASCADE",
        source_schema=DB_SCHEMA,
        referent_schema=DB_SCHEMA,
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Drop CASCADE foreign key constraint
    op.drop_constraint(
        "chat_messages_conversation_id_fkey",
        "chat_messages",
        schema=DB_SCHEMA,
        type_="foreignkey",
    )

    # Recreate foreign key constraint without CASCADE
    op.create_foreign_key(
        "chat_messages_conversation_id_fkey",
        "chat_messages",
        "chat_conversations",
        ["conversation_id"],
        ["id"],
        source_schema=DB_SCHEMA,
        referent_schema=DB_SCHEMA,
    )
