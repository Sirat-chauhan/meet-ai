from authlib.integrations.starlette_client import OAuth

from .config import settings


oauth = OAuth()


def _oauth_enabled(client_id: str, client_secret: str) -> bool:
    cid = (client_id or "").strip()
    csec = (client_secret or "").strip()
    if not cid or not csec:
        return False
    if cid.startswith("your_") or csec.startswith("your_"):
        return False
    return True


def configure_oauth() -> None:
    if _oauth_enabled(settings.google_client_id, settings.google_client_secret):
        oauth.register(
            name="google",
            client_id=settings.google_client_id,
            client_secret=settings.google_client_secret,
            server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
            client_kwargs={"scope": "openid email profile"},
        )

    if _oauth_enabled(settings.github_client_id, settings.github_client_secret):
        oauth.register(
            name="github",
            client_id=settings.github_client_id,
            client_secret=settings.github_client_secret,
            access_token_url="https://github.com/login/oauth/access_token",
            authorize_url="https://github.com/login/oauth/authorize",
            api_base_url="https://api.github.com/",
            client_kwargs={"scope": "user:email"},
        )
