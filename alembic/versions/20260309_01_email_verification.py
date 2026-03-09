"""add email verification fields on users

Revision ID: 20260309_01
Revises: 20260306_01
Create Date: 2026-03-09
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260309_01"
down_revision: Union[str, None] = "20260306_01"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("email_verified", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("users", sa.Column("email_verification_token", sa.String(length=128), nullable=True))
    op.create_index("ix_users_email_verification_token", "users", ["email_verification_token"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_users_email_verification_token", table_name="users")
    op.drop_column("users", "email_verification_token")
    op.drop_column("users", "email_verified")
