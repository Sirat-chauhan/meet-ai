"""initial schema

Revision ID: 20260305_01
Revises:
Create Date: 2026-03-05
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260305_01"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("plan", sa.String(length=32), nullable=False, server_default="free"),
        sa.Column("meetings_used", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_users_id", "users", ["id"])
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "subscriptions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("provider", sa.String(length=32), nullable=False, server_default="stripe"),
        sa.Column("stripe_customer_id", sa.String(length=255), nullable=True),
        sa.Column("stripe_subscription_id", sa.String(length=255), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="inactive"),
        sa.Column("plan", sa.String(length=32), nullable=False, server_default="free"),
        sa.Column("current_period_end", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index("ix_subscriptions_id", "subscriptions", ["id"])
    op.create_index("ix_subscriptions_user_id", "subscriptions", ["user_id"], unique=True)

    op.create_table(
        "agents",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("behavior_prompt", sa.Text(), nullable=False),
        sa.Column("personality", sa.Text(), nullable=False),
        sa.Column("interview_script", sa.Text(), nullable=True),
        sa.Column("temperature", sa.String(length=8), nullable=False, server_default="0.7"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_agents_id", "agents", ["id"])
    op.create_index("ix_agents_user_id", "agents", ["user_id"])

    op.create_table(
        "meetings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("agent_id", sa.Integer(), sa.ForeignKey("agents.id"), nullable=False),
        sa.Column("room_id", sa.String(length=128), nullable=False),
        sa.Column("jitsi_room_name", sa.String(length=128), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="scheduled"),
        sa.Column("recording_url", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(), nullable=True),
        sa.Column("ended_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_meetings_id", "meetings", ["id"])
    op.create_index("ix_meetings_user_id", "meetings", ["user_id"])
    op.create_index("ix_meetings_agent_id", "meetings", ["agent_id"])
    op.create_index("ix_meetings_room_id", "meetings", ["room_id"], unique=True)
    op.create_index("ix_meetings_jitsi_room_name", "meetings", ["jitsi_room_name"], unique=True)

    op.create_table(
        "messages",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("meeting_id", sa.Integer(), sa.ForeignKey("meetings.id"), nullable=False),
        sa.Column("sender", sa.String(length=32), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("is_voice", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_messages_id", "messages", ["id"])
    op.create_index("ix_messages_meeting_id", "messages", ["meeting_id"])

    op.create_table(
        "transcripts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("meeting_id", sa.Integer(), sa.ForeignKey("meetings.id"), nullable=False),
        sa.Column("speaker", sa.String(length=128), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("timestamp", sa.DateTime(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_transcripts_id", "transcripts", ["id"])
    op.create_index("ix_transcripts_meeting_id", "transcripts", ["meeting_id"])

    op.create_table(
        "transcript_embeddings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("transcript_id", sa.Integer(), sa.ForeignKey("transcripts.id"), nullable=False),
        sa.Column("meeting_id", sa.Integer(), sa.ForeignKey("meetings.id"), nullable=False),
        sa.Column("embedding_json", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("transcript_id", name="uq_transcript_embedding_transcript_id"),
    )
    op.create_index("ix_transcript_embeddings_id", "transcript_embeddings", ["id"])
    op.create_index("ix_transcript_embeddings_transcript_id", "transcript_embeddings", ["transcript_id"])
    op.create_index("ix_transcript_embeddings_meeting_id", "transcript_embeddings", ["meeting_id"])

    op.create_table(
        "meeting_summaries",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("meeting_id", sa.Integer(), sa.ForeignKey("meetings.id"), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("key_points", sa.Text(), nullable=False),
        sa.Column("action_items", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("meeting_id", name="uq_meeting_summary_meeting_id"),
    )
    op.create_index("ix_meeting_summaries_id", "meeting_summaries", ["id"])
    op.create_index("ix_meeting_summaries_meeting_id", "meeting_summaries", ["meeting_id"])


def downgrade() -> None:
    op.drop_index("ix_meeting_summaries_meeting_id", table_name="meeting_summaries")
    op.drop_index("ix_meeting_summaries_id", table_name="meeting_summaries")
    op.drop_table("meeting_summaries")

    op.drop_index("ix_transcript_embeddings_meeting_id", table_name="transcript_embeddings")
    op.drop_index("ix_transcript_embeddings_transcript_id", table_name="transcript_embeddings")
    op.drop_index("ix_transcript_embeddings_id", table_name="transcript_embeddings")
    op.drop_table("transcript_embeddings")

    op.drop_index("ix_transcripts_meeting_id", table_name="transcripts")
    op.drop_index("ix_transcripts_id", table_name="transcripts")
    op.drop_table("transcripts")

    op.drop_index("ix_messages_meeting_id", table_name="messages")
    op.drop_index("ix_messages_id", table_name="messages")
    op.drop_table("messages")

    op.drop_index("ix_meetings_jitsi_room_name", table_name="meetings")
    op.drop_index("ix_meetings_room_id", table_name="meetings")
    op.drop_index("ix_meetings_agent_id", table_name="meetings")
    op.drop_index("ix_meetings_user_id", table_name="meetings")
    op.drop_index("ix_meetings_id", table_name="meetings")
    op.drop_table("meetings")

    op.drop_index("ix_agents_user_id", table_name="agents")
    op.drop_index("ix_agents_id", table_name="agents")
    op.drop_table("agents")

    op.drop_index("ix_subscriptions_user_id", table_name="subscriptions")
    op.drop_index("ix_subscriptions_id", table_name="subscriptions")
    op.drop_table("subscriptions")

    op.drop_index("ix_users_email", table_name="users")
    op.drop_index("ix_users_id", table_name="users")
    op.drop_table("users")
