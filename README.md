# Meet AI

AI-powered meeting platform built with Python (FastAPI) and Jitsi, with optional OpenAI intelligence, transcripts, summaries, semantic search, and Razorpay billing scaffolding.

## What is implemented
- FastAPI backend with modular routers
- JWT auth + web cookie auth
- Sidebar logout (`/logout`) that clears auth cookies
- Agent creation (behavior, personality, interview script)
- Meeting creation and Jitsi room embedding
- AI interviewer presence in meeting page
- Voice interview mode:
  - AI asks question by voice
  - user answers by mic
  - primary mode uses browser speech recognition
  - fallback mode records mic chunks and transcribes on server (`/transcripts/transcribe`)
  - AI responds by voice
- Live transcript auto-save during interview
- Post-meeting summary task (Celery-compatible, local fallback)
- Rolling in-meeting summary refresh (`/meetings/{id}/summary/refresh`)
- Embedding-based transcript search
- Live meeting Q&A from transcript memory (`/meetings/{id}/qa`)
- In-meeting transcript filter/search bar (toolbar search)
- Memory page shows transcript-line counts per meeting and warns when selected meeting has no transcript data
- Memory Q&A fallback can answer from recent transcript text when embedding rows are unavailable
- Razorpay webhook scaffolding and plan model
- React frontend scaffold (`frontend/`) for API-driven flow

## Tech stack
- Backend: FastAPI, SQLAlchemy, Jinja templates
- Frontend: React (Vite) + meeting web page template
- DB: SQLite (default local) or PostgreSQL
- Queue: Celery + Redis (optional for local)
- Video: Jitsi (`meet.jit.si`)
- AI: OpenAI (chat, embeddings, whisper endpoint)

## Environment setup
Copy env and edit values:
```bash
cp .env.example .env
```

Important keys:
- `OPENAI_API_KEY`: set this to use OpenAI for live interview intelligence
- `DATABASE_URL`: default local is SQLite (`sqlite:///./ai_meeting_v2.db`)
- `AUTO_CREATE_TABLES=true`: easiest local mode
- `FRONTEND_ORIGIN=http://localhost:5173`
- `APP_BASE_URL`: must match backend URL/port used in local run (for email verification links)
- `SMTP_*`: required for signup email verification (see `.env.example`)
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`: enable Google OAuth login
- `GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET`: enable GitHub OAuth login

### OpenAI Mode (recommended)
Set in `.env`:
- `OPENAI_API_KEY=sk-...`

When set, these features run on OpenAI:
- interview Q&A responses
- summaries
- embeddings-based search
- whisper transcription endpoint

### Optional fallback mode
If `OPENAI_API_KEY` is empty, the app still runs with local fallback logic for interview/summaries/search.

Razorpay keys (only if testing billing):
- `RAZORPAY_KEY_ID=rzp_...`
- `RAZORPAY_KEY_SECRET=...`
- `RAZORPAY_WEBHOOK_SECRET=...`

## Local run (recommended first)
```bash
cd /home/user/Desktop/ai_meeting_platform
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

Open:
- `http://localhost:8001/health`
- `http://localhost:8001/login`

Important: set `APP_BASE_URL=http://localhost:8001` in `.env` when running on port `8001`, otherwise verification links will point to the wrong port.

## Optional React frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open: `http://localhost:5173`

## Optional migration flow (Alembic)
```bash
alembic upgrade head
```

Email verification fields were added in migration `20260309_01`, so run migrations if you already have an existing local DB.

## Optional worker (for background summaries)
```bash
celery -A workers.celery_app.celery worker -Q summaries --loglevel=info
```

## Free deploy mode (single service)
This repo is configured for a free single-service deployment (no managed Redis/Postgres/worker required) using [`render.yaml`](./render.yaml).

### Quick steps
1. Push this repo to GitHub.
2. In Render, create a new **Blueprint** and select this repo.
3. Render will create:
   - `meetai-web` (FastAPI web service)
4. Set required env vars in Render dashboard:
   - `APP_BASE_URL` = your Render web URL
   - `FRONTEND_ORIGIN` = same Render web URL
   - `OPENAI_API_KEY` (if using OpenAI mode)
   - Optional: Razorpay/OAuth keys
5. Deploy.

### Start command used
- Web: `PYTHONPATH=. gunicorn -k uvicorn.workers.UvicornWorker -w 2 -b 0.0.0.0:$PORT app.main:app`

You can reuse this from [`Procfile`](./Procfile) on other non-Docker platforms as well.

## How to test interview quickly
1. Sign up and login at `/login`
2. Create agent with an `interview_script`
3. Start meeting from dashboard
4. Click `Start Interview`
5. Click `Start Mic` and speak
6. Watch mic state text (`Listening...` or fallback transcription mode)
7. AI asks/replies by voice
8. Use top toolbar search in meeting page to filter transcript lines
9. Use sidebar `Logout` to sign out
10. Check transcript list (auto-saves both sides)
11. Click `Refresh Now` under Rolling Summary
12. Ask a question in `Ask Meeting Memory`

## Verify OpenAI is active
1. Set `OPENAI_API_KEY` in `.env`
2. Restart backend
3. Start interview and ask a follow-up
4. If responses feel dynamic/contextual, OpenAI mode is active

## Current limitation
- The AI icon/tile in Jitsi is simulated via in-page/hidden client behavior.
- A fully independent media-stream bot participant in Jitsi requires self-hosted Jitsi bot infrastructure.
- Free single-service mode uses SQLite filesystem storage; data persistence may reset depending on host platform policy.

## Main API routes
- `POST /auth/signup`
- `POST /auth/login`
- `GET /auth/me`
- `GET /logout`
- `POST /agents`
- `GET /agents`
- `POST /meetings`
- `POST /meetings/{meeting_id}/chat`
- `POST /meetings/{meeting_id}/transcripts`
- `POST /meetings/{meeting_id}/transcripts/transcribe`
- `POST /meetings/{meeting_id}/search`
- `POST /meetings/{meeting_id}/end`
- `GET /meetings/{meeting_id}/summary`
- `POST /meetings/{meeting_id}/summary/refresh`
- `POST /meetings/{meeting_id}/qa`
- `POST /billing/webhook`
- `POST /billing/razorpay/order`
