import os
import subprocess
import gradio as gr
import spaces
from app.main import app as fastapi_app

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

# Create a minimal Gradio interface (required by ZeroGPU)
with gr.Blocks(title="Meet AI API") as gradio_interface:
    gr.Markdown("# 🤖 Meet AI - Backend API Server")
    with gr.Row():
        inp = gr.Textbox(label="Health Check", placeholder="Type anything to test...")
        out = gr.Textbox(label="Response")
    inp.submit(health_check, inp, out)
    btn = gr.Button("Check Health")
    btn.click(health_check, inp, out)

# Mount Gradio onto our FastAPI app at a sub-path.
# This preserves ALL FastAPI routes (login, signup, dashboard, etc.)
# We re-assign to 'app' so Hugging Face's server picks up the full FastAPI app.
app = gr.mount_gradio_app(fastapi_app, gradio_interface, path="/_gradio")
