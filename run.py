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
    """A GPU-decorated function to satisfy ZeroGPU requirements."""
    return f"✅ Meet AI Backend is healthy! Echo: {text}"

# Create a minimal Gradio interface that references the GPU function
with gr.Blocks(title="Meet AI API") as demo:
    gr.Markdown("# 🤖 Meet AI - Backend API Server")
    gr.Markdown("The FastAPI backend is running. Access the API at `/docs`.")
    with gr.Row():
        inp = gr.Textbox(label="Health Check", placeholder="Type anything to test...")
        out = gr.Textbox(label="Response")
    inp.submit(health_check, inp, out)
    btn = gr.Button("Check Health")
    btn.click(health_check, inp, out)

# Mount the Gradio UI onto our existing FastAPI app
# All existing API routes (e.g. /api/*, /health, etc.) continue to work
# Gradio UI is served at /gradio
app = gr.mount_gradio_app(fastapi_app, demo, path="/gradio")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 7860))
    print(f"Starting server on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)
