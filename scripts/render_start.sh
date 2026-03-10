set -euo pipefail

export PYTHONPATH=.
# Prefer migrations over auto-create in production-like starts.
export AUTO_CREATE_TABLES="${AUTO_CREATE_TABLES:-false}"

run_migrations() {
  set +e
  out="$(alembic -c alembic.ini upgrade head 2>&1)"
  status=$?
  set -e
  if [ "$status" -eq 0 ]; then
    return 0
  fi

  printf "%s\n" "$out" >&2

  # Render Free has no shell access, so we can’t run one-off `alembic stamp head` manually.
  # If the DB was previously bootstrapped without Alembic (e.g. AUTO_CREATE_TABLES),
  # the initial migration can fail with DuplicateTable. In that case, stamp and continue.
  if printf "%s\n" "$out" | grep -qiE "duplicatetable|relation \"users\" already exists|psycopg2\.errors\.duplicatetable"; then
    echo "Detected existing tables without Alembic version; stamping head to proceed..." >&2
    alembic -c alembic.ini stamp head
    return 0
  fi

  return "$status"
}

run_migrations

exec gunicorn -k uvicorn.workers.UvicornWorker -w 2 -b "0.0.0.0:${PORT:-8000}" app.main:app
