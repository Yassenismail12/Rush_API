#!/usr/bin/env bash
set -euo pipefail

PYTHON_BIN="${PYTHON_BIN:-python3}"

echo "[build] Checking for pending model changes..."
if ! "$PYTHON_BIN" manage.py makemigrations --check --dry-run >/dev/null 2>&1; then
  echo "[build] Creating migrations..."
  "$PYTHON_BIN" manage.py makemigrations --noinput
else
  echo "[build] No new migrations needed."
fi

echo "[build] Applying migrations..."
"$PYTHON_BIN" manage.py migrate --noinput

echo "[build] Collecting static files..."
"$PYTHON_BIN" manage.py collectstatic --noinput

echo "[build] Done."
