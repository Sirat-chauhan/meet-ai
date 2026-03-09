from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..deps import get_current_user, get_db
from ..models import User
from ..schemas import AuthLoginRequest, AuthSignupRequest, TokenResponse, UserResponse
from ..security import create_access_token, hash_password, verify_password
from ..services.supabase_auth_service import (
    SupabaseAuthError,
    is_supabase_auth_enabled,
    sign_in_with_password,
    sign_up,
    sync_local_user,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=UserResponse)
def signup(
    payload: AuthSignupRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    normalized_email = (payload.email or "").strip().lower()
    if is_supabase_auth_enabled():
        try:
            auth_response = sign_up(normalized_email, payload.password)
            auth_user = auth_response.get("user") or {"email": normalized_email}
            return sync_local_user(db, auth_user)
        except SupabaseAuthError as exc:
            if exc.status_code in {400, 422}:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=exc.message) from exc
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=exc.message) from exc

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
