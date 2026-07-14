"""enable rls on all tables

Revision ID: 20260429_01
Revises: 20260423_01
Create Date: 2026-04-29
"""

from typing import Sequence, Union

from alembic import op


revision: str = "20260429_01"
down_revision: Union[str, None] = "20260423_01"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable RLS on all tables
    tables = [
        "users",
        "subscriptions",
        "agents",
        "meetings",
        "messages",
        "transcripts",
        "transcript_embeddings",
        "meeting_summaries",
        "alembic_version"
    ]
    for table in tables:
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;")


def downgrade() -> None:
    # Disable RLS on all tables
    tables = [
        "users",
        "subscriptions",
        "agents",
        "meetings",
        "messages",
        "transcripts",
        "transcript_embeddings",
        "meeting_summaries",
        "alembic_version"
    ]
    for table in tables:
        op.execute(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY;")
