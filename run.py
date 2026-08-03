import os
import subprocess
import gradio as gr
import spaces

def run_migrations():
    print("Running database migrations...")
    try:
        result = subprocess.run(
            ["alembic", "-c", "alembic.ini", "upgrade", "head"], 
            capture_output=True, 
            text=True
        )
        print(result.stdout)
        if result.returncode != 0:
            print("Migration stderr:", result.stderr)
            if "duplicate" in result.stderr.lower() or "already exists" in result.stderr.lower():
                print("Detected existing tables without Alembic version; stamping head to proceed...")
                subprocess.run(["alembic", "-c", "alembic.ini", "stamp", "head"])
    except Exception as e:
        print(f"Error running migrations: {e}")

# Run migrations on startup
run_migrations()

@spaces.GPU
def health_check(text):
    """GPU-decorated function to satisfy ZeroGPU requirements."""
    return f"✅ Meet AI Backend is healthy! Echo: {text}"

# Create the Gradio interface (required by ZeroGPU)
with gr.Blocks(title="Meet AI API") as demo:
    gr.Markdown("# 🤖 Meet AI - Backend API Server")
    gr.Markdown("The FastAPI backend is running. Access the API at `/api/` or `/health`.")
    with gr.Row():
        inp = gr.Textbox(label="Health Check", placeholder="Type anything to test...")
        out = gr.Textbox(label="Response")
    inp.submit(health_check, inp, out)
    btn = gr.Button("Check Health")
    btn.click(health_check, inp, out)

# Import our FastAPI app and mount its routes onto Gradio's internal FastAPI app.
# This way HF launches Gradio (satisfying ZeroGPU), and our API routes work too.
from app.main import app as fastapi_app

# Add all routes from our FastAPI app into Gradio's internal app.
# Insert at the beginning so our API routes are matched before Gradio's catch-all.
for route in fastapi_app.routes:
    demo.app.routes.insert(0, route)

# Add middleware directly (can't copy from FastAPI app reliably)
from starlette.middleware.sessions import SessionMiddleware
from starlette.middleware.cors import CORSMiddleware
from app.config import settings

demo.app.add_middleware(
    SessionMiddleware,
    secret_key=settings.secret_key,
    same_site="lax",
    https_only=False,
)

allowed_origins = sorted({
    settings.frontend_origin,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
})

demo.app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# HF's Gradio runtime auto-detects `demo` and launches it on port 7860.
# Do NOT call demo.launch() or uvicorn.run() — that would cause a port conflict.
