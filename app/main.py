from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from .database import Base, engine
from .oauth import configure_oauth
from .routers import agents, auth, billing, meetings, realtime, search, transcripts, web

app = FastAPI(title=settings.app_name)
configure_oauth()

if settings.auto_create_tables:
    Base.metadata.create_all(bind=engine)

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.secret_key,
    same_site="lax",
    https_only=False,
)

allowed_origins = {
    settings.frontend_origin,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
}

app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted(allowed_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="app/static"), name="static")

app.include_router(web.router)
app.include_router(auth.router)
app.include_router(agents.router)
app.include_router(meetings.router)
app.include_router(transcripts.router)
app.include_router(search.router)
app.include_router(billing.router)
app.include_router(realtime.router)


@app.get("/health")
def health_check():
    return {"status": "ok", "app": settings.app_name, "env": settings.app_env}
