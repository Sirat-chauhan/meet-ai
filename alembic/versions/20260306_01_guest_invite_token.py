"""add guest invite token on meetings

Revision ID: 20260306_01
Revises: 20260305_01
Create Date: 2026-03-06
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260306_01"
down_revision: Union[str, None] = "20260305_01"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("meetings", sa.Column("guest_invite_token", sa.String(length=64), nullable=True))
    op.create_index("ix_meetings_guest_invite_token", "meetings", ["guest_invite_token"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_meetings_guest_invite_token", table_name="meetings")
    op.drop_column("meetings", "guest_invite_token")
