from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from ..database import SessionLocal
from ..models import Agent, Meeting, Message
from ..services.ai_service import ai_service

router = APIRouter(tags=["realtime"])


@router.websocket("/ws/{meeting_id}")
async def meeting_chat_websocket(websocket: WebSocket, meeting_id: int):
    await websocket.accept()
    db = SessionLocal()

    try:
        meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
        if not meeting:
            await websocket.send_text("Meeting not found")
            await websocket.close()
            return

        agent = db.query(Agent).filter(Agent.id == meeting.agent_id).first()
        if not agent:
            await websocket.send_text("Agent not found")
            await websocket.close()
            return

        while True:
            user_message = await websocket.receive_text()
            db.add(Message(meeting_id=meeting.id, sender="user", content=user_message, is_voice=False))
            db.commit()

            rows = (
                db.query(Message)
                .filter(Message.meeting_id == meeting.id)
                .order_by(Message.created_at.asc())
                .all()
            )
            conversation = []
            for row in rows:
                role = "assistant" if row.sender == "ai" else "user"
                conversation.append({"role": role, "content": row.content})

            system_prompt = (
                f"Behavior: {agent.behavior_prompt}\n"
                f"Personality: {agent.personality}\n"
                f"Interview Script: {agent.interview_script or 'N/A'}"
            )
            reply = ai_service.chat_reply(system_prompt, conversation, temperature=float(agent.temperature))

            db.add(Message(meeting_id=meeting.id, sender="ai", content=reply, is_voice=False))
            db.commit()
            await websocket.send_text(reply)

    except WebSocketDisconnect:
        pass
    finally:
        db.close()
