"""add_chat_tables

Revision ID: 6267d9a6a5fb
Revises: 580d10c44d94
Create Date: 2025-11-21 22:30:52.736802

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
revision: str = "6267d9a6a5fb"
down_revision: Union[str, Sequence[str], None] = "580d10c44d94"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create schema if it doesn't exist
    op.execute(sa.text(f'CREATE SCHEMA IF NOT EXISTS "{DB_SCHEMA}"'))

    # Create chat_conversations table
    op.create_table(
        "chat_conversations",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column(
            "created_at",
            postgresql.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            postgresql.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.PrimaryKeyConstraint("id"),
        schema=DB_SCHEMA,
    )
    op.create_index(
        op.f("ix_api_chat_conversations_user_id"),
        "chat_conversations",
        ["user_id"],
        unique=False,
        schema=DB_SCHEMA,
    )

    # Create chat_messages table
    op.create_table(
        "chat_messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("conversation_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("role", sa.String(), nullable=False),
        sa.Column("content", sa.String(), nullable=False),
        sa.Column("model", sa.String(), nullable=True),
        sa.Column(
            "created_at",
            postgresql.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(
            ["conversation_id"],
            [f"{DB_SCHEMA}.chat_conversations.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
        schema=DB_SCHEMA,
    )
    op.create_index(
        op.f("ix_api_chat_messages_conversation_id"),
        "chat_messages",
        ["conversation_id"],
        unique=False,
        schema=DB_SCHEMA,
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Drop chat_messages table
    op.drop_index(
        op.f("ix_api_chat_messages_conversation_id"), table_name="chat_messages", schema=DB_SCHEMA
    )
    op.drop_table("chat_messages", schema=DB_SCHEMA)

    # Drop chat_conversations table
    op.drop_index(
        op.f("ix_api_chat_conversations_user_id"),
        table_name="chat_conversations",
        schema=DB_SCHEMA,
    )
    op.drop_table("chat_conversations", schema=DB_SCHEMA)
