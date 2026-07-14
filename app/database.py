import socket

from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import declarative_base, sessionmaker

from .config import settings


def _normalized_database_url() -> str:
    url = (settings.database_url or "").strip()
    # Accept legacy postgres:// URLs from some providers/platforms.
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://") :]

    if not url:
        return url

    parsed = make_url(url)
    if parsed.drivername.startswith("postgresql") and "sslmode" not in parsed.query:
        parsed = parsed.update_query_dict({"sslmode": "require"})
        return parsed.render_as_string(hide_password=False)

    return url


def _postgres_connect_args(database_url: str) -> dict:
    parsed = make_url(database_url)
    if not parsed.drivername.startswith("postgresql") or not parsed.host:
        return {}

    try:
        addresses = socket.getaddrinfo(
            parsed.host,
            parsed.port or 5432,
            family=socket.AF_INET,
            type=socket.SOCK_STREAM,
        )
    except socket.gaierror:
        return {}

    if not addresses:
        return {}

    # Some deployments can resolve the hostname but cannot route IPv6.
    return {"hostaddr": addresses[0][4][0]}


def _create_engine():
    database_url = _normalized_database_url()
    if database_url.startswith("sqlite"):
        return create_engine(
            database_url,
            connect_args={"check_same_thread": False},
            pool_pre_ping=True,
        )
    return create_engine(
        database_url,
        connect_args=_postgres_connect_args(database_url),
        pool_pre_ping=True,
    )


engine = _create_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
