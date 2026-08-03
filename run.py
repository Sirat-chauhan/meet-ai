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

# Create Gradio interface for ZeroGPU
with gr.Blocks(title="Meet AI API") as demo:
    gr.Markdown("# 🤖 Meet AI - Backend API Server")
    with gr.Row():
        inp = gr.Textbox(label="Health Check", placeholder="Type anything to test...")
        out = gr.Textbox(label="Response")
    btn = gr.Button("Check Health")
    btn.click(health_check, inp, out)

# Launch demo on port 7860 to satisfy ZeroGPU
demo.launch(server_name="0.0.0.0", server_port=7860)
