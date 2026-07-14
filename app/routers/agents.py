from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..deps import get_current_user, get_db
from ..models import Agent, User
from ..schemas import AgentCreateRequest, AgentResponse
from ..services.subscription_service import subscription_service

router = APIRouter(prefix="/agents", tags=["agents"])


@router.post("", response_model=AgentResponse)
def create_agent(
    payload: AgentCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subscription_service.assert_can_create_agent(current_user, db)

    agent = Agent(
        user_id=current_user.id,
        name=payload.name,
        behavior_prompt=payload.behavior_prompt,
        personality=payload.personality,
        interview_script=payload.interview_script,
        temperature=str(payload.temperature),
    )
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return agent


@router.get("", response_model=list[AgentResponse])
def list_agents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Agent).filter(Agent.user_id == current_user.id).order_by(Agent.created_at.desc()).all()


@router.get("/{agent_id}", response_model=AgentResponse)
def get_agent(
    agent_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    agent = db.query(Agent).filter(Agent.id == agent_id, Agent.user_id == current_user.id).first()
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")
    return agent
