import secrets

import requests
from sqlalchemy.orm import Session

from ..config import settings
from ..models import User
from ..security import hash_password


class SupabaseAuthError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def is_supabase_auth_enabled() -> bool:
    return bool((settings.supabase_url or "").strip() and (settings.supabase_anon_key or "").strip())


def _auth_headers(access_token: str | None = None) -> dict[str, str]:
    headers = {
        "apikey": settings.supabase_anon_key,
        "Content-Type": "application/json",
    }
    if access_token:
        headers["Authorization"] = f"Bearer {access_token}"
    return headers


def _auth_url(path: str) -> str:
    return f"{settings.supabase_url.rstrip('/')}/auth/v1{path}"


def _request(method: str, path: str, payload: dict | None = None, access_token: str | None = None) -> dict:
    response = requests.request(
        method,
        _auth_url(path),
        headers=_auth_headers(access_token),
        json=payload,
        timeout=20,
    )

    if response.ok:
        if not response.content:
            return {}
        return response.json()

    try:
        error_payload = response.json()
    except ValueError:
        error_payload = {}

    message = (
        error_payload.get("msg")
        or error_payload.get("message")
        or error_payload.get("error_description")
        or error_payload.get("error")
        or "Supabase authentication request failed"
    )
    raise SupabaseAuthError(message, status_code=response.status_code)


def sign_up(email: str, password: str, email_redirect_to: str | None = None) -> dict:
    payload: dict[str, object] = {"email": email, "password": password}
    if email_redirect_to:
        payload["options"] = {"email_redirect_to": email_redirect_to}
    return _request("POST", "/signup", payload=payload)


def sign_in_with_password(email: str, password: str) -> dict:
    return _request("POST", "/token?grant_type=password", payload={"email": email, "password": password})


def get_user(access_token: str) -> dict:
    return _request("GET", "/user", access_token=access_token)


def sync_local_user(db: Session, auth_user: dict) -> User:
    email = (auth_user.get("email") or "").strip().lower()
    if not email:
        raise SupabaseAuthError("Authenticated user does not include an email address", status_code=401)

    user = db.query(User).filter(User.email == email).first()
    confirmed = bool(auth_user.get("email_confirmed_at"))

    if not user:
        user = User(
            email=email,
            password_hash=hash_password(secrets.token_urlsafe(32)),
            email_verified=confirmed,
            email_verification_token=None,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    updates_required = False
    if confirmed and not user.email_verified:
        user.email_verified = True
        user.email_verification_token = None
        updates_required = True

    if not user.password_hash:
        user.password_hash = hash_password(secrets.token_urlsafe(32))
        updates_required = True

    if updates_required:
        db.add(user)
        db.commit()
        db.refresh(user)

    return user
