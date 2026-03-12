import json
import logging

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, UploadFile, status
from sqlalchemy.orm import Session

from ..config import settings
<<<<<<< HEAD
=======
from ..database import SessionLocal
>>>>>>> 1a9d697 (Improve meeting UI and mic transcription)
from ..deps import get_current_user, get_db
from ..models import Meeting, Transcript, TranscriptEmbedding, User
from ..schemas import TranscriptCreateRequest, TranscriptResponse
from ..services.ai_service import ai_service
from ..services.subscription_service import subscription_service

router = APIRouter(prefix="/meetings/{meeting_id}/transcripts", tags=["transcripts"])
logger = logging.getLogger(__name__)

_CONTENT_TYPE_BY_EXT = {
    "webm": "audio/webm",
    "ogg": "audio/ogg",
    "oga": "audio/ogg",
    "wav": "audio/wav",
    "mp3": "audio/mpeg",
    "mpga": "audio/mpeg",
    "m4a": "audio/mp4",
    "mp4": "audio/mp4",
    "flac": "audio/flac",
}


def _normalize_audio_content_type(filename: str, content_type: str | None) -> str:
    ct = (content_type or "").split(";", 1)[0].strip().lower()
    if ct and ct not in {"application/octet-stream", "binary/octet-stream"}:
        return ct
    ext = (filename.rsplit(".", 1)[-1] if "." in filename else "").lower()
    return _CONTENT_TYPE_BY_EXT.get(ext, "audio/webm")


def _create_embedding_row(transcript_id: int, meeting_id: int, text: str) -> None:
    normalized = (text or "").strip()
    if not normalized:
        return
    db = SessionLocal()
    try:
        embedding = ai_service.embed_text(normalized)
        row = TranscriptEmbedding(
            transcript_id=transcript_id,
            meeting_id=meeting_id,
            embedding_json=json.dumps(embedding),
        )
        db.add(row)
        db.commit()
    except Exception:  # noqa: BLE001
        logger.exception("Failed to create transcript embedding")
        db.rollback()
    finally:
        db.close()


@router.post("", response_model=TranscriptResponse)
def add_transcript_line(
    meeting_id: int,
    payload: TranscriptCreateRequest,
    background_tasks: BackgroundTasks,
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

    background_tasks.add_task(_create_embedding_row, transcript.id, meeting_id, payload.text)

    return transcript


@router.post("/transcribe", response_model=TranscriptResponse)
async def transcribe_audio(
    meeting_id: int,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id, Meeting.user_id == current_user.id).first()
    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")
    subscription_service.assert_can_add_transcript(current_user, db)

<<<<<<< HEAD
    if not settings.enable_server_transcription:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Server transcription is disabled (ENABLE_SERVER_TRANSCRIPTION=false).",
=======
    form = await request.form()
    speaker = (form.get("speaker") or request.query_params.get("speaker") or "candidate").strip()
    audio = form.get("audio") or form.get("file")
    if not getattr(audio, "filename", None) or not getattr(audio, "file", None):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "Missing audio file upload (expected multipart field: audio). "
                f"Got fields={sorted(list(form.keys()))} content_type={request.headers.get('content-type')}"
            ),
>>>>>>> 1a9d697 (Improve meeting UI and mic transcription)
        )

    if not ai_service.client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OPENAI_API_KEY missing; live transcription unavailable.",
        )

    audio_bytes = await audio.read()
<<<<<<< HEAD
    transcript_result = ai_service.client.audio.transcriptions.create(
        model=settings.openai_transcription_model,
        file=(audio.filename or "audio.webm", audio_bytes, audio.content_type or "audio/webm"),
    )
    text = transcript_result.text
=======
    if not audio_bytes:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Empty audio upload; allow mic permissions and speak for a few seconds.",
        )
    if len(audio_bytes) < 12_000:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Audio too short; speak for a few seconds and try again.",
        )
    try:
        filename = getattr(audio, "filename", None) or "audio.webm"
        if "." not in filename:
            filename = f"{filename}.webm"
        content_type = _normalize_audio_content_type(filename, getattr(audio, "content_type", None))
        transcript_result = ai_service.client.audio.transcriptions.create(
            model=settings.openai_transcription_model,
            file=(filename, audio_bytes, content_type),
        )
        text = transcript_result.text
    except Exception as exc:  # noqa: BLE001
        logger.exception("Transcription failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Transcription failed.",
        ) from exc
>>>>>>> 1a9d697 (Improve meeting UI and mic transcription)

    transcript = Transcript(meeting_id=meeting_id, speaker=speaker, text=text)
    db.add(transcript)
    db.commit()
    db.refresh(transcript)

    background_tasks.add_task(_create_embedding_row, transcript.id, meeting_id, text)
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
