from datetime import datetime

from pydantic import BaseModel, Field


class AuthSignupRequest(BaseModel):
    email: str
    password: str = Field(min_length=8)


class AuthLoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    email: str
    email_verified: bool
    plan: str

    class Config:
        from_attributes = True


class AgentCreateRequest(BaseModel):
    name: str
    behavior_prompt: str
    personality: str
    interview_script: str | None = None
    temperature: float = 0.7


class AgentResponse(BaseModel):
    id: int
    name: str
    behavior_prompt: str
    personality: str
    interview_script: str | None
    temperature: str

    class Config:
        from_attributes = True


class MeetingCreateRequest(BaseModel):
    agent_id: int


class MeetingEndRequest(BaseModel):
    recording_url: str | None = None


class MeetingResponse(BaseModel):
    id: int
    room_id: str
    jitsi_room_name: str
    guest_invite_token: str | None = None
    status: str
    recording_url: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class TranscriptCreateRequest(BaseModel):
    speaker: str
    text: str
    timestamp: datetime | None = None


class TranscriptResponse(BaseModel):
    id: int
    meeting_id: int
    speaker: str
    text: str
    timestamp: datetime

    class Config:
        from_attributes = True


class MeetingSummaryResponse(BaseModel):
    meeting_id: int
    summary: str
    key_points: str
    action_items: str

    class Config:
        from_attributes = True


class SearchRequest(BaseModel):
    query: str
    top_k: int = 5


class SearchResultItem(BaseModel):
    transcript_id: int
    score: float
    speaker: str
    text: str
    timestamp: datetime


class SearchResponse(BaseModel):
    results: list[SearchResultItem]


class ChatMessageRequest(BaseModel):
    message: str
    is_voice: bool = False


class ChatMessageResponse(BaseModel):
    reply: str


class MeetingQARequest(BaseModel):
    question: str
    top_k: int = 5


class MeetingQAResponse(BaseModel):
    question: str
    answer: str
    context_used: list[str]
