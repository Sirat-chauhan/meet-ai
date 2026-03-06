from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from .config import settings


def _create_engine():
    if settings.database_url.startswith("sqlite"):
        return create_engine(settings.database_url, connect_args={"check_same_thread": False})
    return create_engine(settings.database_url)


engine = _create_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
