from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from .database import SessionLocal
from .models import User
from .security import decode_access_token, is_jwt_error
from .services.supabase_auth_service import (
    SupabaseAuthError,
    get_user as get_supabase_user,
    is_supabase_auth_enabled,
    sync_local_user,
)


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _extract_token_from_request(request: Request) -> str | None:
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.lower().startswith("bearer "):
        return auth_header.split(" ", 1)[1]

    cookie_token = request.cookies.get("access_token")
    if cookie_token and cookie_token.lower().startswith("bearer "):
        return cookie_token.split(" ", 1)[1]
    if cookie_token:
        return cookie_token

    return None


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
    token_from_oauth: str | None = Depends(oauth2_scheme),
) -> User:
    token = _extract_token_from_request(request) or token_from_oauth
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    if is_supabase_auth_enabled():
        try:
            auth_user = get_supabase_user(token)
            return sync_local_user(db, auth_user)
        except SupabaseAuthError as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=exc.message) from exc

    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        return user
    except Exception as exc:
        if is_jwt_error(exc) or isinstance(exc, (ValueError, TypeError)):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials") from exc
        if isinstance(exc, HTTPException):
            raise
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication failed") from exc
