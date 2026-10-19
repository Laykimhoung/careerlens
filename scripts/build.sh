#!/usr/bin/env bash
# ==============================================================================
# CareerLens - Production Build Script for Render (Linux Web Service)
# ==============================================================================
# This script executes during Render's build lifecycle:
# 1. Ensures pip is up to date
# 2. Installs pinned production dependencies from requirements.txt
# 3. Validates Django project settings via system check
# 4. Collects static assets (Admin & DRF styles) using WhiteNoise into STATIC_ROOT
#
# NOTE: Database migrations are intentionally EXCLUDED here to avoid race
# conditions and accidental schema mutations during build phases. Migrations
# should be applied via Render Shell or release command prior to serving traffic.
# ==============================================================================

set -o errexit  # Exit immediately if a command exits with a non-zero status

echo "==> [CareerLens] Upgrading pip..."
python -m pip install --upgrade pip

echo "==> [CareerLens] Installing dependencies from requirements.txt..."
pip install -r requirements.txt

echo "==> [CareerLens] Running Django system verification checks..."
python manage.py check

echo "==> [CareerLens] Collecting static files with WhiteNoise into staticfiles/..."
python manage.py collectstatic --no-input

echo "==> [CareerLens] Production build completed successfully!"
