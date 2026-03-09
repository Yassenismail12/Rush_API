#!/bin/bash
set -euo pipefail

if [ -f ".env" ]; then
  echo "[build] Loading .env variables..."
  set -a
  source .env
  set +a
fi

echo "[build] Running migrations..."
python3 manage.py makemigrations --noinput
python3 manage.py migrate --noinput

echo "[build] Collecting static files..."
python3 manage.py collectstatic --noinput

echo "[build] Complete."
