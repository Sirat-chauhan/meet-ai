from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    plan: Mapped[str] = mapped_column(String(32), default="free")
    meetings_used: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    agents = relationship("Agent", back_populates="owner", cascade="all, delete-orphan")
    meetings = relationship("Meeting", back_populates="owner", cascade="all, delete-orphan")
    subscription = relationship("Subscription", back_populates="user", uselist=False, cascade="all, delete-orphan")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, index=True)
    provider: Mapped[str] = mapped_column(String(32), default="razorpay")
    status: Mapped[str] = mapped_column(String(32), default="inactive")
    plan: Mapped[str] = mapped_column(String(32), default="free")
    current_period_end: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="subscription")


class Agent(Base):
    __tablename__ = "agents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(120))
    behavior_prompt: Mapped[str] = mapped_column(Text)
    personality: Mapped[str] = mapped_column(Text)
    interview_script: Mapped[str | None] = mapped_column(Text, nullable=True)
    temperature: Mapped[str] = mapped_column(String(8), default="0.7")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="agents")
    meetings = relationship("Meeting", back_populates="agent")


class Meeting(Base):
    __tablename__ = "meetings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    agent_id: Mapped[int] = mapped_column(ForeignKey("agents.id"), index=True)

    room_id: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    jitsi_room_name: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    guest_invite_token: Mapped[str | None] = mapped_column(String(64), unique=True, index=True, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="scheduled")
    recording_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="meetings")
    agent = relationship("Agent", back_populates="meetings")
    messages = relationship("Message", back_populates="meeting", cascade="all, delete-orphan")
    transcripts = relationship("Transcript", back_populates="meeting", cascade="all, delete-orphan")
    summary = relationship("MeetingSummary", back_populates="meeting", uselist=False, cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    meeting_id: Mapped[int] = mapped_column(ForeignKey("meetings.id"), index=True)
    sender: Mapped[str] = mapped_column(String(32))
    content: Mapped[str] = mapped_column(Text)
    is_voice: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    meeting = relationship("Meeting", back_populates="messages")


class Transcript(Base):
    __tablename__ = "transcripts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    meeting_id: Mapped[int] = mapped_column(ForeignKey("meetings.id"), index=True)
    speaker: Mapped[str] = mapped_column(String(128))
    text: Mapped[str] = mapped_column(Text)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    meeting = relationship("Meeting", back_populates="transcripts")
    embedding = relationship("TranscriptEmbedding", back_populates="transcript", uselist=False, cascade="all, delete-orphan")


class TranscriptEmbedding(Base):
    __tablename__ = "transcript_embeddings"
    __table_args__ = (UniqueConstraint("transcript_id", name="uq_transcript_embedding_transcript_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    transcript_id: Mapped[int] = mapped_column(ForeignKey("transcripts.id"), index=True)
    meeting_id: Mapped[int] = mapped_column(ForeignKey("meetings.id"), index=True)
    embedding_json: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    transcript = relationship("Transcript", back_populates="embedding")


class MeetingSummary(Base):
    __tablename__ = "meeting_summaries"
    __table_args__ = (UniqueConstraint("meeting_id", name="uq_meeting_summary_meeting_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    meeting_id: Mapped[int] = mapped_column(ForeignKey("meetings.id"), index=True)

    summary: Mapped[str] = mapped_column(Text)
    key_points: Mapped[str] = mapped_column(Text)
    action_items: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    meeting = relationship("Meeting", back_populates="summary")
