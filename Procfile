web: bash -lc 'PYTHONPATH=. alembic upgrade head && gunicorn -k uvicorn.workers.UvicornWorker -w 2 -b 0.0.0.0:${PORT:-8000} app.main:app'
worker: celery -A workers.celery_app.celery worker -Q summaries --loglevel=info
