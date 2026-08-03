import os
import subprocess
import uvicorn
from app.main import app

def run_migrations():
    print("Running database migrations...")
    try:
        # Run alembic migrations
        result = subprocess.run(
            ["alembic", "-c", "alembic.ini", "upgrade", "head"], 
            capture_output=True, 
            text=True
        )
        print(result.stdout)
        if result.returncode != 0:
            print("Migration stderr:", result.stderr)
            # Check for duplicate table error which is handled in start.sh
            if "duplicate" in result.stderr.lower() or "already exists" in result.stderr.lower():
                print("Detected existing tables without Alembic version; stamping head to proceed...")
                subprocess.run(["alembic", "-c", "alembic.ini", "stamp", "head"])
    except Exception as e:
        print(f"Error running migrations: {e}")

if __name__ == "__main__":
    # Run DB migrations
    run_migrations()
    
    # Hugging Face Gradio Spaces expect the app to run on port 7860
    port = int(os.environ.get("PORT", 7860))
    print(f"Starting server on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)
