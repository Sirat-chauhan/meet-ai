from datetime import datetime, timedelta
import secrets

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..config import settings
from ..deps import get_current_user, get_db
from ..models import User
from ..schemas import (
    AuthForgotPasswordRequest,
    AuthLoginRequest,
    AuthResetPasswordRequest,
    AuthSignupRequest,
    TokenResponse,
    UserResponse,
)
from ..security import create_access_token, hash_password, verify_password
from ..services.email_service import send_password_reset_email
from ..services.supabase_auth_service import (
    SupabaseAuthError,
    is_supabase_auth_enabled,
    request_password_reset,
    sign_in_with_password,
    sign_up,
    sync_local_user,
    update_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _verified_redirect_url() -> str:
    base = (settings.frontend_origin or settings.app_base_url or "").strip().rstrip("/")
    if not base:
        return "/login?message=Email+verified.+You+can+log+in+now."
    return f"{base}/?verified=1"


def _password_reset_redirect_url() -> str:
    base = (settings.app_base_url or settings.frontend_origin or "").strip().rstrip("/")
    if not base:
        return "/reset-password"
    return f"{base}/reset-password"


def _normalize_signup_error_message(message: str) -> str:
    normalized = (message or "").strip()
    lowered = normalized.lower()
    if (
        "for security purposes" in lowered
        or "request this after" in lowered
        or "rate limit" in lowered
        or "email rate limit exceeded" in lowered
    ):
        return "Confirmation mail has been sent. Please check your email and confirm your account."
    return normalized


def _new_password_reset_token() -> str:
    return secrets.token_urlsafe(36)


@router.post("/signup", response_model=UserResponse)
def signup(
    payload: AuthSignupRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    normalized_email = (payload.email or "").strip().lower()
    if is_supabase_auth_enabled():
        try:
            auth_response = sign_up(
                normalized_email,
                payload.password,
                email_redirect_to=_verified_redirect_url(),
            )
            auth_user = auth_response.get("user") or {"email": normalized_email}
            return sync_local_user(db, auth_user)
        except SupabaseAuthError as exc:
            message = _normalize_signup_error_message(exc.message)
            if exc.status_code in {400, 422}:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=message) from exc
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message) from exc

    existing = db.query(User).filter(User.email == normalized_email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        email=normalized_email,
        password_hash=hash_password(payload.password),
        email_verified=False,
        email_verification_token=None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login(payload: AuthLoginRequest, db: Session = Depends(get_db)):
    normalized_email = (payload.email or "").strip().lower()
    if is_supabase_auth_enabled():
        try:
            auth_response = sign_in_with_password(normalized_email, payload.password)
            auth_user = auth_response.get("user") or {}
            sync_local_user(db, auth_user)
            return TokenResponse(access_token=auth_response["access_token"])
        except SupabaseAuthError as exc:
            detail = exc.message
            if "email not confirmed" in detail.lower():
                detail = "Email not verified. Please verify your email first."
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail) from exc

    user = db.query(User).filter(User.email == normalized_email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please verify your email first.",
        )

    token = create_access_token({"sub": str(user.id), "email": user.email})
    return TokenResponse(access_token=token)


@router.get("/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    if is_supabase_auth_enabled():
        return {"message": "Email verification is handled by Supabase. Open the link from your inbox and then log in."}

    user = db.query(User).filter(User.email_verification_token == token).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token")

    user.email_verified = True
    user.email_verification_token = None
    db.add(user)
    db.commit()
    return {"message": "Email verified", "verified_at": datetime.utcnow().isoformat()}


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/forgot-password")
def forgot_password(
    payload: AuthForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    normalized_email = (payload.email or "").strip().lower()
    generic_message = {
        "message": "If an account exists for that email, a password reset link has been sent."
    }

    if is_supabase_auth_enabled():
        try:
            request_password_reset(normalized_email, redirect_to=_password_reset_redirect_url())
        except SupabaseAuthError:
            return generic_message
        return generic_message

    user = db.query(User).filter(User.email == normalized_email).first()
    if not user:
        return generic_message

    user.password_reset_token = _new_password_reset_token()
    user.password_reset_expires_at = datetime.utcnow() + timedelta(minutes=settings.password_reset_expire_minutes)
    db.add(user)
    db.commit()
    background_tasks.add_task(send_password_reset_email, user.email, user.password_reset_token)
    return generic_message


@router.post("/reset-password")
def reset_password(payload: AuthResetPasswordRequest, db: Session = Depends(get_db)):
    if is_supabase_auth_enabled():
        access_token = (payload.access_token or "").strip()
        if not access_token:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing recovery access token")
        try:
            update_password(access_token, payload.password)
            return {"message": "Password updated successfully"}
        except SupabaseAuthError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=exc.message) from exc

    token = (payload.token or "").strip()
    if not token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing reset token")

    user = db.query(User).filter(User.password_reset_token == token).first()
    if (
        not user
        or not user.password_reset_expires_at
        or user.password_reset_expires_at < datetime.utcnow()
    ):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token")

    user.password_hash = hash_password(payload.password)
    user.password_reset_token = None
    user.password_reset_expires_at = None
    db.add(user)
    db.commit()
    return {"message": "Password updated successfully"}
