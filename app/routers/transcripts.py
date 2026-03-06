import json

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from ..deps import get_current_user, get_db
from ..models import Meeting, Transcript, TranscriptEmbedding, User
from ..schemas import TranscriptCreateRequest, TranscriptResponse
from ..services.ai_service import ai_service
from ..services.subscription_service import subscription_service

router = APIRouter(prefix="/meetings/{meeting_id}/transcripts", tags=["transcripts"])


@router.post("", response_model=TranscriptResponse)
def add_transcript_line(
    meeting_id: int,
    payload: TranscriptCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id, Meeting.user_id == current_user.id).first()
    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")
    subscription_service.assert_can_add_transcript(current_user, db)

    transcript = Transcript(
        meeting_id=meeting_id,
        speaker=payload.speaker,
        text=payload.text,
        timestamp=payload.timestamp,
    )
    db.add(transcript)
    db.commit()
    db.refresh(transcript)

    embedding = ai_service.embed_text(payload.text)
    row = TranscriptEmbedding(
        transcript_id=transcript.id,
        meeting_id=meeting_id,
        embedding_json=json.dumps(embedding),
    )
    db.add(row)
    db.commit()

    return transcript


@router.post("/transcribe", response_model=TranscriptResponse)
async def transcribe_audio(
    meeting_id: int,
    speaker: str,
    audio: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id, Meeting.user_id == current_user.id).first()
    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")
    subscription_service.assert_can_add_transcript(current_user, db)

    if not ai_service.client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OPENAI_API_KEY missing; live transcription unavailable.",
        )

    audio_bytes = await audio.read()
    transcript_result = ai_service.client.audio.transcriptions.create(
        model="whisper-1",
        file=(audio.filename or "audio.webm", audio_bytes, audio.content_type or "audio/webm"),
    )
    text = transcript_result.text

    transcript = Transcript(meeting_id=meeting_id, speaker=speaker, text=text)
    db.add(transcript)
    db.commit()
    db.refresh(transcript)

    embedding = ai_service.embed_text(text)
    row = TranscriptEmbedding(
        transcript_id=transcript.id,
        meeting_id=meeting_id,
        embedding_json=json.dumps(embedding),
    )
    db.add(row)
    db.commit()
    return transcript


@router.get("", response_model=list[TranscriptResponse])
def list_transcripts(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id, Meeting.user_id == current_user.id).first()
    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")

    return (
        db.query(Transcript)
        .filter(Transcript.meeting_id == meeting_id)
        .order_by(Transcript.timestamp.asc())
        .all()
    )
