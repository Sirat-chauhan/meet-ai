from datetime import datetime
import secrets

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..deps import get_current_user, get_db
from ..models import User
from ..schemas import AuthLoginRequest, AuthSignupRequest, TokenResponse, UserResponse
from ..security import create_access_token, hash_password, verify_password
from ..services.email_service import send_verification_email

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=UserResponse)
def signup(
    payload: AuthSignupRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    normalized_email = (payload.email or "").strip().lower()
    existing = db.query(User).filter(User.email == normalized_email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    token = secrets.token_urlsafe(36)
    user = User(
        email=normalized_email,
        password_hash=hash_password(payload.password),
        email_verified=False,
        email_verification_token=token,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    background_tasks.add_task(send_verification_email, user.email, token)
    return user


@router.post("/login", response_model=TokenResponse)
def login(payload: AuthLoginRequest, db: Session = Depends(get_db)):
    normalized_email = (payload.email or "").strip().lower()
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
