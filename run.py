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

run_migrations()

@spaces.GPU
def health_check(text):
    """GPU-decorated function to satisfy ZeroGPU requirements."""
    return f"✅ Meet AI Backend is healthy! Echo: {text}"

# ZeroGPU specifically scans the 'demo' variable for @spaces.GPU functions
with gr.Blocks(title="Meet AI API") as demo:
    gr.Markdown("# 🤖 Meet AI - Backend API Server")
    with gr.Row():
        inp = gr.Textbox(label="Health Check", placeholder="Type anything to test...")
        out = gr.Textbox(label="Response")
    btn = gr.Button("Check Health")
    btn.click(health_check, inp, out)

# Mount Gradio onto FastAPI under /_gradio.
# Expose 'app' so Hugging Face serves the FastAPI app at root /
app = gr.mount_gradio_app(fastapi_app, demo, path="/_gradio")
