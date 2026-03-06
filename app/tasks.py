from sqlalchemy.orm import Session

from .database import SessionLocal
from .models import Meeting, MeetingSummary, Transcript
from .services.ai_service import ai_service
from workers.celery_app import celery


def _build_transcript_text(db: Session, meeting_id: int) -> str:
    rows = (
        db.query(Transcript)
        .filter(Transcript.meeting_id == meeting_id)
        .order_by(Transcript.timestamp.asc())
        .all()
    )
    return "\n".join(f"[{row.timestamp.isoformat()}] {row.speaker}: {row.text}" for row in rows)


def generate_meeting_summary(meeting_id: int) -> None:
    db = SessionLocal()
    try:
        meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
        if not meeting:
            return

        transcript_text = _build_transcript_text(db, meeting_id)
        summary_payload = ai_service.summarize_meeting(transcript_text)

        summary = db.query(MeetingSummary).filter(MeetingSummary.meeting_id == meeting_id).first()
        if not summary:
            summary = MeetingSummary(meeting_id=meeting_id, **summary_payload)
        else:
            summary.summary = summary_payload["summary"]
            summary.key_points = summary_payload["key_points"]
            summary.action_items = summary_payload["action_items"]

        db.add(summary)
        db.commit()
    finally:
        db.close()


@celery.task(name="app.tasks.generate_meeting_summary_task")
def generate_meeting_summary_task(meeting_id: int) -> None:
    generate_meeting_summary(meeting_id)
