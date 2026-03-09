from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from .config import settings


def _normalized_database_url() -> str:
    url = (settings.database_url or "").strip()
    # Accept legacy postgres:// URLs from some providers/platforms.
    if url.startswith("postgres://"):
        return "postgresql://" + url[len("postgres://") :]
    return url


def _create_engine():
    database_url = _normalized_database_url()
    if database_url.startswith("sqlite"):
        return create_engine(
            database_url,
            connect_args={"check_same_thread": False},
            pool_pre_ping=True,
        )
    return create_engine(database_url, pool_pre_ping=True)


engine = _create_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
