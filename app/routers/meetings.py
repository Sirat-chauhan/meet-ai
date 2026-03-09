import uuid
from datetime import datetime
import json

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..config import settings
from ..deps import get_current_user, get_db
from ..models import Agent, Meeting, MeetingSummary, Message, Transcript, TranscriptEmbedding, User
from ..schemas import (
    ChatMessageRequest,
    ChatMessageResponse,
    MeetingCreateRequest,
    MeetingEndRequest,
    MeetingQARequest,
    MeetingQAResponse,
    MeetingResponse,
    MeetingSummaryResponse,
)
from ..services.ai_service import ai_service
from ..services.subscription_service import subscription_service
from ..tasks import generate_meeting_summary

router = APIRouter(prefix="/meetings", tags=["meetings"])


@router.post("", response_model=MeetingResponse)
def create_meeting(
    payload: MeetingCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    agent = db.query(Agent).filter(Agent.id == payload.agent_id, Agent.user_id == current_user.id).first()
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")

    subscription_service.assert_can_start_meeting(current_user, db)

    room_suffix = uuid.uuid4().hex[:10]
    room_id = f"meeting-{room_suffix}"
    jitsi_room_name = room_id

    meeting = Meeting(
        user_id=current_user.id,
        agent_id=agent.id,
        room_id=room_id,
        jitsi_room_name=jitsi_room_name,
        guest_invite_token=uuid.uuid4().hex,
        status="active",
        started_at=datetime.utcnow(),
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)

    subscription_service.increment_meeting_count(current_user, db)
    return meeting


@router.get("", response_model=list[MeetingResponse])
def list_meetings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Meeting)
        .filter(Meeting.user_id == current_user.id)
        .order_by(Meeting.created_at.desc())
        .all()
    )


@router.get("/{meeting_id}", response_model=MeetingResponse)
def get_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id, Meeting.user_id == current_user.id).first()
    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")
    return meeting


@router.post("/{meeting_id}/chat", response_model=ChatMessageResponse)
def chat_with_agent(
    meeting_id: int,
    payload: ChatMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id, Meeting.user_id == current_user.id).first()
    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")

    agent = db.query(Agent).filter(Agent.id == meeting.agent_id).first()
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")

    user_message = Message(meeting_id=meeting.id, sender="user", content=payload.message, is_voice=payload.is_voice)
    db.add(user_message)
    db.commit()

    prior_messages = (
        db.query(Message)
        .filter(Message.meeting_id == meeting.id)
        .order_by(Message.created_at.asc())
        .all()
    )

    conversation = []
    for msg in prior_messages:
        role = "assistant" if msg.sender == "ai" else "user"
        conversation.append({"role": role, "content": msg.content})

    system_prompt = (
        f"Behavior: {agent.behavior_prompt}\n"
        f"Personality: {agent.personality}\n"
        f"Interview Script: {agent.interview_script or 'N/A'}"
    )
    reply = ai_service.chat_reply(system_prompt, conversation, temperature=float(agent.temperature))

    ai_message = Message(meeting_id=meeting.id, sender="ai", content=reply, is_voice=False)
    db.add(ai_message)
    db.commit()

    return ChatMessageResponse(reply=reply)


@router.post("/{meeting_id}/end", response_model=MeetingResponse)
def end_meeting(
    meeting_id: int,
    payload: MeetingEndRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id, Meeting.user_id == current_user.id).first()
    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")

    meeting.status = "completed"
    meeting.ended_at = datetime.utcnow()
    meeting.recording_url = payload.recording_url
    db.add(meeting)
    db.commit()

    background_tasks.add_task(generate_meeting_summary, meeting.id)

    db.refresh(meeting)
    return meeting


@router.get("/{meeting_id}/summary", response_model=MeetingSummaryResponse)
def get_meeting_summary(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id, Meeting.user_id == current_user.id).first()
    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")

    summary = db.query(MeetingSummary).filter(MeetingSummary.meeting_id == meeting_id).first()
    if not summary:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Summary not ready")
    return summary


@router.post("/{meeting_id}/summary/refresh", response_model=MeetingSummaryResponse)
def refresh_meeting_summary(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id, Meeting.user_id == current_user.id).first()
    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")

    generate_meeting_summary(meeting_id)
    summary = db.query(MeetingSummary).filter(MeetingSummary.meeting_id == meeting_id).first()
    if not summary:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Summary not ready")
    return summary


@router.post("/{meeting_id}/qa", response_model=MeetingQAResponse)
def ask_meeting_memory(
    meeting_id: int,
    payload: MeetingQARequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id, Meeting.user_id == current_user.id).first()
    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")

    query_embedding = ai_service.embed_text(payload.question)
    rows = (
        db.query(TranscriptEmbedding, Transcript)
        .join(Transcript, Transcript.id == TranscriptEmbedding.transcript_id)
        .filter(TranscriptEmbedding.meeting_id == meeting_id)
        .all()
    )

    ranked: list[tuple[float, str]] = []
    for embedding_row, transcript in rows:
        emb = json.loads(embedding_row.embedding_json)
        score = ai_service.cosine_similarity(query_embedding, emb)
        ranked.append((score, f"{transcript.speaker}: {transcript.text}"))

    ranked.sort(key=lambda item: item[0], reverse=True)
    context_used = [text for _, text in ranked[: payload.top_k]]
    answer = ai_service.answer_from_context(payload.question, context_used)
    return MeetingQAResponse(question=payload.question, answer=answer, context_used=context_used)
