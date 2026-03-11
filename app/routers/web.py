import uuid
import secrets
import json
from urllib.parse import quote_plus
from datetime import datetime, timedelta

from fastapi import APIRouter, BackgroundTasks, Depends, Form, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..deps import get_db
from ..models import Agent, Meeting, Subscription, Transcript, TranscriptEmbedding, User
from ..oauth import oauth
from ..security import create_access_token, hash_password, verify_password
from ..config import settings
from ..services.email_service import send_verification_email
from ..services.ai_service import ai_service
from ..services.subscription_service import subscription_service
from ..services.supabase_auth_service import (
    SupabaseAuthError,
    get_user as get_supabase_user,
    is_supabase_auth_enabled,
    sign_in_with_password,
    sign_up as supabase_sign_up,
    sync_local_user,
)

router = APIRouter(tags=["web"])
templates = Jinja2Templates(directory="app/templates")


def _oauth_enabled(client_id: str, client_secret: str) -> bool:
    cid = (client_id or "").strip()
    csec = (client_secret or "").strip()
    if not cid or not csec:
        return False
    # Ignore placeholder values copied from examples.
    if cid.startswith("your_") or csec.startswith("your_"):
        return False
    return True


def _current_user_from_cookie(request: Request, db: Session) -> User | None:
    cookie_token = request.cookies.get("access_token")
    if cookie_token:
        if cookie_token.lower().startswith("bearer "):
            cookie_token = cookie_token.split(" ", 1)[1]
        if is_supabase_auth_enabled():
            try:
                auth_user = get_supabase_user(cookie_token)
                return sync_local_user(db, auth_user)
            except SupabaseAuthError:
                return None

    user_id = request.cookies.get("user_id")
    if not user_id:
        return None
    return db.query(User).filter(User.id == int(user_id)).first()


def _login_redirect_for_user(user: User, access_token: str | None = None) -> RedirectResponse:
    token = access_token or create_access_token({"sub": str(user.id), "email": user.email})
    response = RedirectResponse("/dashboard", status_code=302)
    response.set_cookie("user_id", str(user.id), httponly=True)
    response.set_cookie("access_token", f"Bearer {token}", httponly=True)
    return response


def _ensure_meeting_invite_token(meeting: Meeting) -> bool:
    if meeting.guest_invite_token:
        return False
    meeting.guest_invite_token = uuid.uuid4().hex
    return True


def _guest_join_url(request: Request, invite_token: str | None) -> str:
    if not invite_token:
        return ""
    return str(request.url_for("guest_meeting_page", invite_token=quote_plus(invite_token)))


def _new_email_verification_token() -> str:
    return secrets.token_urlsafe(36)


def _transcript_counts_by_meeting(db: Session, user_id: int) -> dict[int, int]:
    rows = (
        db.query(Transcript.meeting_id, func.count(Transcript.id))
        .join(Meeting, Meeting.id == Transcript.meeting_id)
        .filter(Meeting.user_id == user_id)
        .group_by(Transcript.meeting_id)
        .all()
    )
    return {meeting_id: int(count) for meeting_id, count in rows}


@router.get("/", response_class=HTMLResponse)
def root(request: Request):
    return RedirectResponse("/login", status_code=302)


@router.get("/signup", response_class=HTMLResponse)
def signup_page(request: Request):
    return templates.TemplateResponse(
        "signup.html",
        {
            "request": request,
            "oauth_google_enabled": _oauth_enabled(settings.google_client_id, settings.google_client_secret),
            "oauth_github_enabled": _oauth_enabled(settings.github_client_id, settings.github_client_secret),
        },
    )


@router.post("/signup")
def signup(
    background_tasks: BackgroundTasks,
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db),
):
    normalized_email = (email or "").strip().lower()
    if is_supabase_auth_enabled():
        redirect_to = f"{settings.app_base_url.rstrip('/')}/login?message={quote_plus('Email verified. You can log in now.')}"
        try:
            auth_response = supabase_sign_up(normalized_email, password, email_redirect_to=redirect_to)
            auth_user = auth_response.get("user") or {"email": normalized_email}
            sync_local_user(db, auth_user)
            return RedirectResponse(
                "/login?message=Check+your+email+to+verify+your+account+before+logging+in.",
                status_code=302,
            )
        except SupabaseAuthError as exc:
            message = quote_plus(exc.message)
            return RedirectResponse(f"/signup?error={message}", status_code=302)

    existing = db.query(User).filter(User.email == normalized_email).first()
    if existing:
        if not existing.email_verified:
            existing.email_verification_token = _new_email_verification_token()
            db.add(existing)
            db.commit()
            background_tasks.add_task(send_verification_email, existing.email, existing.email_verification_token)
            return RedirectResponse(
                "/login?error=Email+already+registered.+Verification+email+resent.+Please+verify+and+log+in.",
                status_code=302,
            )
        return RedirectResponse("/login?error=Email+already+registered.+Please+log+in.", status_code=302)

    token = _new_email_verification_token()
    user = User(
        email=normalized_email,
        password_hash=hash_password(password),
        email_verified=False,
        email_verification_token=token,
    )
    db.add(user)
    db.commit()
    background_tasks.add_task(send_verification_email, normalized_email, token)
    return RedirectResponse("/login?error=Please+verify+your+email+before+logging+in.", status_code=302)


@router.get("/login", response_class=HTMLResponse)
def login_page(request: Request):
    return templates.TemplateResponse(
        "login.html",
        {
            "request": request,
            "oauth_google_enabled": _oauth_enabled(settings.google_client_id, settings.google_client_secret),
            "oauth_github_enabled": _oauth_enabled(settings.github_client_id, settings.github_client_secret),
        },
    )


@router.post("/login")
def login(
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db),
):
    normalized_email = (email or "").strip().lower()
    if is_supabase_auth_enabled():
        try:
            auth_response = sign_in_with_password(normalized_email, password)
            auth_user = auth_response.get("user") or {}
            user = sync_local_user(db, auth_user)
            return _login_redirect_for_user(user, access_token=auth_response["access_token"])
        except SupabaseAuthError as exc:
            message = exc.message
            if "email not confirmed" in message.lower():
                message = "Please verify your email before logging in."
            elif "invalid login credentials" in message.lower():
                message = "Invalid credentials"
            return RedirectResponse(f"/login?error={quote_plus(message)}", status_code=302)

    user = db.query(User).filter(User.email == normalized_email).first()
    if not user or not verify_password(password, user.password_hash):
        return RedirectResponse("/login?error=Invalid+credentials", status_code=302)
    if not user.email_verified:
        return RedirectResponse("/login?error=Please+verify+your+email+before+logging+in.", status_code=302)

    return _login_redirect_for_user(user)


@router.get("/logout")
def logout():
    response = RedirectResponse("/login", status_code=302)
    response.delete_cookie("user_id")
    response.delete_cookie("access_token")
    return response


@router.get("/auth/oauth/{provider}/start")
async def oauth_start(provider: str, request: Request):
    provider = provider.lower()
    if provider not in {"google", "github"}:
        return RedirectResponse("/login?error=Unsupported+provider", status_code=302)
    client = oauth.create_client(provider)
    if client is None:
        return RedirectResponse("/login?error=Provider+not+configured", status_code=302)

    redirect_uri = str(request.url_for("oauth_callback", provider=provider))
    return await client.authorize_redirect(request, redirect_uri)


@router.get("/auth/oauth/{provider}/callback", name="oauth_callback")
async def oauth_callback(provider: str, request: Request, db: Session = Depends(get_db)):
    provider = provider.lower()
    if provider not in {"google", "github"}:
        return RedirectResponse("/login?error=Unsupported+provider", status_code=302)
    client = oauth.create_client(provider)
    if client is None:
        return RedirectResponse("/login?error=Provider+not+configured", status_code=302)

    token = await client.authorize_access_token(request)

    email: str | None = None
    if provider == "google":
        user_info = token.get("userinfo")
        if not user_info:
            user_info = await client.parse_id_token(request, token)
        email = user_info.get("email") if user_info else None
    elif provider == "github":
        profile_resp = await client.get("user", token=token)
        profile = profile_resp.json()
        email = profile.get("email")
        if not email:
            emails_resp = await client.get("user/emails", token=token)
            for item in emails_resp.json():
                if item.get("primary") and item.get("verified"):
                    email = item.get("email")
                    break
            if not email:
                for item in emails_resp.json():
                    if item.get("verified"):
                        email = item.get("email")
                        break

    if not email:
        return RedirectResponse("/login?error=Could+not+read+email+from+provider", status_code=302)
    email = email.strip().lower()

    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            password_hash=hash_password(secrets.token_urlsafe(32)),
            email_verified=True,
            email_verification_token=None,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    elif not user.email_verified:
        user.email_verified = True
        user.email_verification_token = None
        db.add(user)
        db.commit()

    return _login_redirect_for_user(user)


@router.get("/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    if is_supabase_auth_enabled():
        return RedirectResponse("/login?message=Email+verified.+You+can+log+in+now.", status_code=302)

    user = db.query(User).filter(User.email_verification_token == token).first()
    if not user:
        return RedirectResponse("/login?error=Invalid+or+expired+verification+link.", status_code=302)
    user.email_verified = True
    user.email_verification_token = None
    db.add(user)
    db.commit()
    return RedirectResponse("/login?error=Email+verified.+You+can+log+in+now.", status_code=302)


@router.get("/dashboard", response_class=HTMLResponse)
def dashboard(request: Request, db: Session = Depends(get_db)):
    user = _current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse("/login", status_code=302)

    agents = db.query(Agent).filter(Agent.user_id == user.id).order_by(Agent.created_at.desc()).all()
    meetings = db.query(Meeting).filter(Meeting.user_id == user.id).order_by(Meeting.created_at.desc()).all()
    agent_map = {agent.id: agent.name for agent in agents}
    meeting_rows = []
    updated_tokens = False
    updated_status = False
    for meeting in meetings:
        updated_tokens = _ensure_meeting_invite_token(meeting) or updated_tokens
        if meeting.ended_at and meeting.status != "completed":
            meeting.status = "completed"
            updated_status = True
        duration = "0 minutes"
        if meeting.started_at and meeting.ended_at:
            mins = max(int((meeting.ended_at - meeting.started_at).total_seconds() // 60), 1)
            duration = f"{mins} minutes"
        elif meeting.started_at:
            mins = max(int((datetime.utcnow() - meeting.started_at).total_seconds() // 60), 1)
            duration = f"{mins} minutes"
        meeting_rows.append(
            {
                "id": meeting.id,
                "room_id": meeting.room_id,
                "status": meeting.status.capitalize(),
                "agent_name": agent_map.get(meeting.agent_id, "Agent"),
                "duration": duration,
                "guest_join_url": _guest_join_url(request, meeting.guest_invite_token),
            }
        )
    if updated_tokens or updated_status:
        db.commit()
    return templates.TemplateResponse(
        "dashboard.html",
        {
            "request": request,
            "user": user,
            "agents": agents,
            "meetings": meetings,
            "meeting_rows": meeting_rows,
            "active_page": "meetings",
        },
    )


@router.get("/memory", response_class=HTMLResponse)
def memory_page(request: Request, db: Session = Depends(get_db)):
    user = _current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse("/login", status_code=302)

    meetings = (
        db.query(Meeting)
        .filter(Meeting.user_id == user.id)
        .order_by(Meeting.created_at.desc())
        .all()
    )
    transcript_counts = _transcript_counts_by_meeting(db, user.id)
    return templates.TemplateResponse(
        "memory.html",
        {
            "request": request,
            "user": user,
            "active_page": "memory",
            "meetings": meetings,
            "transcript_counts": transcript_counts,
            "selected_meeting_id": "all",
            "selected_transcript_count": sum(transcript_counts.values()),
            "question": "",
            "answer": "",
            "context_used": [],
        },
    )


@router.post("/memory/ask", response_class=HTMLResponse)
def memory_ask(
    request: Request,
    meeting_id: str = Form("all"),
    question: str = Form(""),
    db: Session = Depends(get_db),
):
    user = _current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse("/login", status_code=302)

    meetings = (
        db.query(Meeting)
        .filter(Meeting.user_id == user.id)
        .order_by(Meeting.created_at.desc())
        .all()
    )
    transcript_counts = _transcript_counts_by_meeting(db, user.id)

    normalized_question = (question or "").strip()
    if not normalized_question:
        return templates.TemplateResponse(
            "memory.html",
            {
                "request": request,
                "user": user,
                "active_page": "memory",
                "meetings": meetings,
                "transcript_counts": transcript_counts,
                "selected_meeting_id": meeting_id,
                "selected_transcript_count": (
                    sum(transcript_counts.values()) if meeting_id == "all" else transcript_counts.get(int(meeting_id), 0)
                    if meeting_id.isdigit() else 0
                ),
                "question": normalized_question,
                "answer": "Please enter a question.",
                "context_used": [],
            },
        )

    query_embedding = ai_service.embed_text(normalized_question)

    rows_query = (
        db.query(TranscriptEmbedding, Transcript, Meeting)
        .join(Transcript, Transcript.id == TranscriptEmbedding.transcript_id)
        .join(Meeting, Meeting.id == TranscriptEmbedding.meeting_id)
        .filter(Meeting.user_id == user.id)
    )
    selected_meeting_id: int | None = None
    if meeting_id != "all":
        try:
            selected_meeting_id = int(meeting_id)
        except ValueError:
            selected_meeting_id = None
        if selected_meeting_id is not None:
            rows_query = rows_query.filter(TranscriptEmbedding.meeting_id == selected_meeting_id)

    rows = rows_query.all()
    ranked: list[tuple[float, str, str]] = []
    for embedding_row, transcript, meeting in rows:
        emb = json.loads(embedding_row.embedding_json)
        score = ai_service.cosine_similarity(query_embedding, emb)
        context_text = f"{meeting.room_id} | {transcript.speaker}: {transcript.text}"
        ranked.append((score, context_text, transcript.text))

    if ranked:
        ranked.sort(key=lambda item: item[0], reverse=True)
        best_context_texts = [item[2] for item in ranked[:5]]
        answer = ai_service.answer_from_context(normalized_question, best_context_texts)
        context_used = [item[1] for item in ranked[:5]]
    else:
        # Fallback for meetings that have transcripts but no embedding rows yet.
        transcript_query = (
            db.query(Transcript, Meeting)
            .join(Meeting, Meeting.id == Transcript.meeting_id)
            .filter(Meeting.user_id == user.id)
        )
        if selected_meeting_id is not None:
            transcript_query = transcript_query.filter(Transcript.meeting_id == selected_meeting_id)
        transcript_rows = transcript_query.order_by(Transcript.timestamp.desc()).limit(20).all()
        if transcript_rows:
            context_used = [
                f"{meeting.room_id} | {transcript.speaker}: {transcript.text}"
                for transcript, meeting in transcript_rows[:5]
            ]
            answer = ai_service.answer_from_context(
                normalized_question,
                [transcript.text for transcript, _ in transcript_rows[:5]],
            )
        else:
            scope = "selected meeting" if selected_meeting_id is not None else "all meetings"
            answer = f"No transcripts found for the {scope}. Record a meeting first or choose a meeting with transcripts."
            context_used = []

    selected_transcript_count = (
        sum(transcript_counts.values())
        if selected_meeting_id is None
        else transcript_counts.get(selected_meeting_id, 0)
    )

    return templates.TemplateResponse(
        "memory.html",
        {
            "request": request,
            "user": user,
            "active_page": "memory",
            "meetings": meetings,
            "transcript_counts": transcript_counts,
            "selected_meeting_id": meeting_id,
            "selected_transcript_count": selected_transcript_count,
            "question": normalized_question,
            "answer": answer,
            "context_used": context_used,
        },
    )


@router.get("/create-agent", response_class=HTMLResponse)
def create_agent_page(request: Request, db: Session = Depends(get_db)):
    user = _current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse("/login", status_code=302)
    message = request.query_params.get("message")
    return templates.TemplateResponse(
        "create_agent.html",
        {
            "request": request,
            "active_page": "agents",
            "user": user,
            "message": message,
        },
    )


@router.post("/create-agent")
def create_agent(
    request: Request,
    name: str = Form(...),
    behavior_prompt: str = Form(...),
    personality: str = Form(...),
    interview_script: str = Form(""),
    temperature: str = Form("0.7"),
    db: Session = Depends(get_db),
):
    user = _current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse("/login", status_code=302)
    try:
        subscription_service.assert_can_create_agent(user, db)
    except HTTPException as exc:
        msg = str(exc.detail).replace(" ", "+")
        return RedirectResponse(f"/create-agent?message={msg}", status_code=302)

    agent = Agent(
        user_id=user.id,
        name=name,
        behavior_prompt=behavior_prompt,
        personality=personality,
        interview_script=interview_script,
        temperature=temperature,
    )
    db.add(agent)
    db.commit()
    return RedirectResponse("/dashboard", status_code=302)


@router.get("/start-meeting/{agent_id}")
def start_meeting(agent_id: int, request: Request, db: Session = Depends(get_db)):
    user = _current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse("/login", status_code=302)

    agent = db.query(Agent).filter(Agent.id == agent_id, Agent.user_id == user.id).first()
    if not agent:
        return RedirectResponse("/dashboard", status_code=302)

    subscription_service.assert_can_start_meeting(user, db)

    room_suffix = uuid.uuid4().hex[:10]
    room_id = f"meeting-{room_suffix}"
    meeting = Meeting(
        user_id=user.id,
        agent_id=agent.id,
        room_id=room_id,
        jitsi_room_name=room_id,
        guest_invite_token=uuid.uuid4().hex,
        status="active",
        started_at=datetime.utcnow(),
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)

    subscription_service.increment_meeting_count(user, db)
    return RedirectResponse(f"/meeting/{meeting.id}", status_code=302)


@router.get("/meeting/{meeting_id}", response_class=HTMLResponse)
def meeting_page(meeting_id: int, request: Request, db: Session = Depends(get_db)):
    user = _current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse("/login", status_code=302)

    meeting = db.query(Meeting).filter(Meeting.id == meeting_id, Meeting.user_id == user.id).first()
    if not meeting:
        return RedirectResponse("/dashboard", status_code=302)
    if _ensure_meeting_invite_token(meeting):
        db.commit()
        db.refresh(meeting)
    agent = db.query(Agent).filter(Agent.id == meeting.agent_id).first()
    if not agent:
        return RedirectResponse("/dashboard", status_code=302)

    transcripts = (
        db.query(Transcript)
        .filter(Transcript.meeting_id == meeting.id)
        .order_by(Transcript.timestamp.asc())
        .all()
    )

    return templates.TemplateResponse(
        "meeting.html",
        {
            "request": request,
            "meeting": meeting,
            "agent": agent,
            "transcripts": transcripts,
            "jitsi_domain": settings.jitsi_domain,
            "guest_join_url": _guest_join_url(request, meeting.guest_invite_token),
            "active_page": "meetings",
            "user": user,
            "enable_server_transcription": settings.enable_server_transcription,
        },
    )


@router.get("/join/{invite_token}", response_class=HTMLResponse, name="guest_meeting_page")
def guest_meeting_page(invite_token: str, request: Request, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.guest_invite_token == invite_token).first()
    if not meeting:
        return HTMLResponse("<h2>Invalid invite link</h2>", status_code=404)

    agent = db.query(Agent).filter(Agent.id == meeting.agent_id).first()
    if not agent:
        return RedirectResponse("/login", status_code=302)

    return templates.TemplateResponse(
        "guest_meeting.html",
        {
            "request": request,
            "meeting": meeting,
            "agent": agent,
            "jitsi_domain": settings.jitsi_domain,
        },
    )


@router.get("/upgrade", response_class=HTMLResponse)
def upgrade_page(request: Request, db: Session = Depends(get_db)):
    user = _current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse("/login", status_code=302)
    message = request.query_params.get("message")
    return templates.TemplateResponse(
        "upgrade.html",
        {
            "request": request,
            "user": user,
            "active_page": "upgrade",
            "message": message,
        },
    )


@router.post("/upgrade/select")
def select_upgrade_plan(
    request: Request,
    plan: str = Form(...),
    cycle: str = Form("monthly"),
    db: Session = Depends(get_db),
):
    user = _current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse("/login", status_code=302)

    normalized_plan = plan.strip().lower()
    if normalized_plan not in {"free", "pro", "enterprise"}:
        return RedirectResponse("/upgrade?message=Invalid+plan", status_code=302)

    subscription = db.query(Subscription).filter(Subscription.user_id == user.id).first()
    if not subscription:
        subscription = Subscription(user_id=user.id)

    subscription.plan = normalized_plan
    subscription.status = "active" if normalized_plan != "free" else "inactive"
    subscription.provider = "razorpay_manual"
    subscription.current_period_end = (
        datetime.utcnow() + timedelta(days=365)
        if cycle == "yearly" and normalized_plan != "free"
        else (datetime.utcnow() + timedelta(days=30) if normalized_plan != "free" else None)
    )

    user.plan = normalized_plan
    if normalized_plan != "free":
        # Reset free quota counter when upgrading.
        user.meetings_used = 0

    db.add(subscription)
    db.add(user)
    db.commit()

    msg = f"Plan+updated+to+{normalized_plan.title()}"
    return RedirectResponse(f"/upgrade?message={msg}", status_code=302)
