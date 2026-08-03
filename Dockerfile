FROM python:3.12-slim

# Create a non-root user that Hugging Face Spaces expects (uid 1000)
RUN useradd -m -u 1000 user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=7860

WORKDIR $HOME/app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY --chown=user:user . .

USER user

# Hugging Face Spaces routes traffic to port 7860
EXPOSE 7860

CMD ["bash", "-lc", "bash scripts/start.sh"]
