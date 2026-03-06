from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..config import settings
from ..models import Agent, Meeting, Transcript, User


class SubscriptionService:
    @staticmethod
    def assert_can_start_meeting(user: User, db: Session) -> None:
        if user.plan in {"pro", "enterprise"}:
            return

        if user.meetings_used >= settings.free_plan_meeting_limit:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=f"Free plan limit reached ({settings.free_plan_meeting_limit} meetings/month).",
            )

    @staticmethod
    def assert_can_create_agent(user: User, db: Session) -> None:
        if user.plan in {"pro", "enterprise"}:
            return

        count = db.query(Agent).filter(Agent.user_id == user.id).count()
        if count >= settings.free_plan_agent_limit:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=f"Free plan agent limit reached ({settings.free_plan_agent_limit} agents). Upgrade to Pro.",
            )

    @staticmethod
    def assert_can_add_transcript(user: User, db: Session) -> None:
        if user.plan in {"pro", "enterprise"}:
            return

        count = (
            db.query(Transcript)
            .join(Meeting, Meeting.id == Transcript.meeting_id)
            .filter(Meeting.user_id == user.id)
            .count()
        )
        if count >= settings.free_plan_transcript_limit:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=(
                    f"Free plan transcript limit reached ({settings.free_plan_transcript_limit} lines). "
                    "Upgrade to Pro for unlimited transcripts."
                ),
            )

    @staticmethod
    def increment_meeting_count(user: User, db: Session) -> None:
        user.meetings_used += 1
        db.add(user)
        db.commit()


subscription_service = SubscriptionService()
