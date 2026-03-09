# Meet AI Project Synopsis

Generated on: 2026-03-09
Repository root: `/home/user/Desktop/ai_meeting_platform`

## 1) Executive Summary
Meet AI is a FastAPI-based meeting platform with:
- User authentication (email/password + optional can be added Google/GitHub OAuth)
- Email verification workflow
- AI-agent creation (behavior/personality/interview script)
- Meeting lifecycle with Jitsi embed
- Live chat and transcript capture
- Transcript embeddings + semantic search
- Meeting memory Q&A (RAG-like retrieval)
- Meeting summarization (OpenAI-first, local fallback)
- Billing/upgrade scaffolding with Razorpay
- Optional Celery/Redis async execution
- Separate React/Vite frontend prototype (`frontend/`)

## 2) High-Level Architecture
### Backend Runtime
- Framework: FastAPI
- ORM: SQLAlchemy
- DB: SQLite by default (PostgreSQL supported via `DATABASE_URL`)
- Templates: Jinja2 server-rendered web UI
- Realtime: WebSocket endpoint for meeting chat
- AI provider: OpenAI SDK when key present; deterministic local fallbacks when absent
- Background jobs: Celery if installed/configured; inline fallback if not

### Main Request Flow
1. User authenticates and receives JWT (`/auth/login`) or cookie-based web session (`/login`).
2. User creates an agent (`/agents` or `/create-agent`).
3. User starts a meeting (`/meetings` API or `/start-meeting/{agent_id}` web route).
4. Meeting UI streams chat/transcripts:
   - Chat via WebSocket `/ws/{meeting_id}`
   - Transcript lines via `/meetings/{id}/transcripts`
   - Optional audio transcription via `/transcripts/transcribe`
5. Transcript text is embedded and stored for search/memory.
6. Summary generated on-demand or at meeting end.

## 3) Database Model (Core Entities)
- `User`: credentials, plan, usage counters, email verification state.
- `Subscription`: current plan and billing period.
- `Agent`: AI persona and interview settings.
- `Meeting`: room IDs, status, invite token, timestamps.
- `Message`: chat turns (`user`/`ai`).
- `Transcript`: meeting lines with speaker + timestamp.
- `TranscriptEmbedding`: vector for each transcript line.
- `MeetingSummary`: persisted summary, key points, action items.

## 4) File-by-File Explanation

### Root / Infra Files
- `README.md`
  - Project overview, setup commands, features list, deployment notes, route map.
  - Documents local and free-host deployment paths.

- `requirements.txt`
  - Python dependency lock for FastAPI, SQLAlchemy, Alembic, Authlib, Celery, Redis, Razorpay, OpenAI, etc.

- `Dockerfile`
  - Minimal Python 3.12 image, installs requirements, runs `uvicorn` on port 8000.

- `docker-compose.yml`
  - Defines `api` container and Node-based `frontend` dev container.

- `Procfile`
  - Production-like start command via `gunicorn` + `uvicorn` worker.
  - Runs `alembic upgrade head` before app boot.

- `render.yaml`
  - Render blueprint for one free web service (`meetai-web`) with env var definitions.

- `alembic.ini`
  - Alembic logging and migration config.

- `LICENSE`
  - MIT license text.

### Alembic Migration Files
- `alembic/env.py`
  - Connects Alembic to app settings and SQLAlchemy metadata.
  - Supports offline and online migrations.

- `alembic/script.py.mako`
  - Template used to generate new migration scripts.

- `alembic/versions/20260305_01_initial.py`
  - Initial schema creation (users, subscriptions, agents, meetings, messages, transcripts, embeddings, summaries).

- `alembic/versions/20260306_01_guest_invite_token.py`
  - Adds `meetings.guest_invite_token` + unique index.

- `alembic/versions/20260309_01_email_verification.py`
  - Adds `users.email_verified` and `users.email_verification_token` + index.

### Backend Core (`app/`)
- `app/main.py`
  - FastAPI app entrypoint.
  - Configures OAuth providers.
  - Optionally auto-creates tables.
  - Adds session + CORS middleware.
  - Mounts static files and all routers.
  - Exposes `/health`.

- `app/config.py`
  - Loads `.env` via `python-dotenv`.
  - `Settings` dataclass centralizes all runtime config: app, auth, DB, OpenAI, billing, plans, OAuth, SMTP.

- `app/database.py`
  - Creates SQLAlchemy engine/session.
  - Handles SQLite thread setting.
  - Exposes `Base` metadata.

- `app/models.py`
  - SQLAlchemy ORM schema.
  - Defines relationships and uniqueness constraints.

- `app/schemas.py`
  - Pydantic request/response models for auth, agents, meetings, transcripts, search, chat, and Q&A.

- `app/security.py`
  - Password hashing (`bcrypt`), verification.
  - JWT creation/decoding and JWT-error identification.

- `app/deps.py`
  - DI helpers: DB session provider and current-user resolver.
  - Supports token from `Authorization` header or auth cookie.

- `app/oauth.py`
  - Registers Google/GitHub OAuth clients conditionally when credentials are real.

- `app/tasks.py`
  - Summary generation task logic.
  - Builds transcript text, calls AI summarizer, upserts `MeetingSummary`.
  - Exposes Celery task wrapper.

- `app/static/styles.css`
  - Main styling for Jinja pages.
  - Includes layout/sidebar, auth pages, meeting live view, pricing cards, and responsive breakpoints.

#### Services (`app/services/`)
- `app/services/ai_service.py`
  - Central AI abstraction.
  - Uses OpenAI for chat, summary JSON, embeddings, and context answering.
  - Provides robust local fallback mode:
    - deterministic pseudo-embeddings
    - script-driven local interviewer behavior
    - local summary synthesis

- `app/services/email_service.py`
  - Builds verification links from `APP_BASE_URL`.
  - Sends SMTP verification email or logs fallback link when SMTP not configured.

- `app/services/subscription_service.py`
  - Enforces plan limits for meetings, agents, transcript lines.
  - Increments meeting usage counters.

- `app/services/__init__.py`
  - Package marker (no logic).

#### Routers (`app/routers/`)
- `app/routers/__init__.py`
  - Imports router modules for clean app registration.

- `app/routers/auth.py`
  - API auth endpoints:
    - `POST /auth/signup`
    - `POST /auth/login`
    - `GET /auth/verify-email`
    - `GET /auth/me`
  - Enforces email verification before login token issuance.

- `app/routers/agents.py`
  - Agent CRUD subset:
    - create/list/get
  - Checks plan limits before create.

- `app/routers/meetings.py`
  - Meeting and AI interaction API:
    - create/list/get
    - chat with agent
    - end meeting
    - get/refresh summary
    - ask memory Q&A
  - Builds prompts from agent behavior/personality/script.
  - Uses embeddings for context ranking.

- `app/routers/transcripts.py`
  - Transcript endpoints:
    - add transcript line
    - list transcripts
    - transcribe audio upload via Whisper when OpenAI available
  - Persists embedding rows per transcript.

- `app/routers/search.py`
  - Semantic transcript search endpoint.
  - Embeds query, compares cosine similarity against stored embeddings.

- `app/routers/realtime.py`
  - WebSocket `/ws/{meeting_id}` for live chat.
  - Saves chat messages to DB and returns AI response per turn.

- `app/routers/billing.py`
  - Plan listing and Razorpay integration scaffolding.
  - Creates orders via SDK or raw HTTP fallback.
  - Verifies payment signature.
  - Handles webhook updates to subscription/user plan.

- `app/routers/web.py`
  - Server-rendered web app routes:
    - auth pages (`/login`, `/signup`, `/logout`)
    - OAuth start/callback
    - dashboard, agent creation, meeting page, guest join
    - memory ask page
    - upgrade page + plan selection
  - Uses cookie-based user lookup for web UI.
  - Includes transcript fallback behavior when embeddings are missing.

### Templates (`app/templates/`)
- `app/templates/base.html`
  - Shared shell, sidebar nav, auth-vs-logged-in layout switching.

- `app/templates/login.html`
  - Login form + optional OAuth buttons.

- `app/templates/signup.html`
  - Signup form + optional OAuth buttons.

- `app/templates/dashboard.html`
  - Meeting list, filters, quick agent meeting launch, invite-link copy.

- `app/templates/create_agent.html`
  - Agent creation form (name/prompt/personality/script/temperature).

- `app/templates/meeting.html`
  - Most complex page: Jitsi embed + AI bot panel + transcript + memory Q&A + rolling summary.
  - JS logic includes:
    - WebSocket chat send/receive
    - transcript persistence
    - browser speech recognition + fallback MediaRecorder transcription
    - periodic summary refresh
    - semantic in-page transcript filter
    - device permission toggles
    - meeting end lifecycle handling

- `app/templates/guest_meeting.html`
  - Guest-only Jitsi join page with basic media controls.

- `app/templates/memory.html`
  - Cross-meeting question answering UI.
  - Shows selected scope and transcript-aware hints.

- `app/templates/upgrade.html`
  - Pricing cards and Razorpay checkout JS integration.
  - Includes payment verification callback path.

### Worker
- `workers/celery_app.py`
  - Creates real Celery app when dependency exists.
  - Provides inline fake-task fallback when Celery unavailable, preserving `.delay()` calls.

### React Frontend (`frontend/`)
- `frontend/package.json`
  - Vite + React project scripts and dependency declarations.

- `frontend/package-lock.json`
  - NPM lockfile (generated, large; dependency resolution data).

- `frontend/index.html`
  - Vite HTML entrypoint mounting React root.

- `frontend/src/main.jsx`
  - React bootstrapping + `ErrorBoundary` wrapper.

- `frontend/src/api.js`
  - API utility helpers (`apiFetch`, `getApiBaseUrl`, websocket base URL transform).

- `frontend/src/styles.css`
  - Minimal global reset for root container.

- `frontend/src/App.jsx`
  - Full prototype UI implemented as local-state demo.
  - Contains pages/components:
    - auth screen
    - meetings list/details
    - in-call visual simulation
    - transcript/summary/recording tabs
    - mock ask-AI panel
    - agents page
    - upgrade page
    - modal creators for meetings/agents
  - Important note: this file is largely mock/demo-oriented and not wired to backend endpoints for core flows.

## 5) Security and Auth Notes
- API token handling supports both bearer header and cookie bearer token.
- Web pages rely on `user_id` cookie and can set JWT cookie for API calls.
- Email verification blocks login until verified.
- Payment signature verification exists for Razorpay.

## 6) AI and Retrieval Implementation Notes
- Embedding rows are created at transcript-write time.
- Search/Q&A both use cosine similarity over stored vectors.
- If OpenAI key missing:
  - embeddings become deterministic pseudo-vectors
  - summarization and chat fallback to local heuristic behavior

## 7) Billing / Plan Logic
- Free plan limits are enforced in service layer:
  - meetings per period
  - number of agents
  - transcript lines
- Upgrade routes adjust `User.plan`, `Subscription`, and reset usage where applicable.

## 8) Operational Behavior and Deployment
- Local quick path: `uvicorn app.main:app --reload`.
- Production path: `gunicorn` with Uvicorn workers.
- Render blueprint is set for single service with SQLite.
- Celery/Redis support is optional and disabled by default.

## 9) Gaps and Cautions
- Template route `/verify-email` and API route `/auth/verify-email` both exist; behavior differs (HTML redirect vs JSON).
- `frontend/src/App.jsx` includes direct fetch to Anthropic endpoint without auth key handling and is not production-integrated.
- Billing module still contains naming remnants from earlier Stripe schema in initial migration history.
- Meeting bot presence in Jitsi is simulated via hidden second client tab embed, not a true server-side bot process.

## 10) Suggested Next Engineering Steps
1. Unify web and API auth/session model to reduce duplicate logic.
2. Move large inline JS from `meeting.html` into static module files for maintainability.
3. Add automated tests for auth, meeting lifecycle, transcript embedding/search, and billing verification.
4. Wire React frontend to real backend APIs (or remove prototype to avoid drift).
5. Add rate limiting and stronger cookie security for production (`secure`, stricter `samesite` where applicable).

