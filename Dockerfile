FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Render “Docker” services expect the app to listen on $PORT.
CMD ["bash", "-lc", "bash scripts/render_start.sh"]
