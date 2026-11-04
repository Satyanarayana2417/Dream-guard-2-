# ==============================================================================
# DreamGuard — High-Performance Multi-Stage Dockerfile
# Compatible with: Hugging Face Spaces (16GB RAM), Render, Fly.io, OCI, and Local
# ==============================================================================

# --- Stage 1: Build React Frontend ---
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
COPY FULL_CODE/frontend/package*.json ./
RUN npm install --no-audit --no-fund
COPY FULL_CODE/frontend/ ./
RUN npm run build

# --- Stage 2: Production Python Backend + Built UI ---
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    SENTINEL_ENV=production \
    SENTINEL_DATASET_DIR=/app/Datasets \
    SENTINEL_DATA_DIR=/app/data

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY FULL_CODE/backend/requirements.txt /app/FULL_CODE/backend/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /app/FULL_CODE/backend/requirements.txt

# Copy source code and official dataset
COPY FULL_CODE /app/FULL_CODE
COPY Datasets /app/Datasets

# Copy compiled frontend from Stage 1 into backend's expected dist directory
COPY --from=frontend-builder /app/frontend/dist /app/FULL_CODE/frontend/dist

# Set up non-root user (UID 1000 required for Hugging Face Spaces)
RUN useradd -m -u 1000 appuser && \
    mkdir -p /app/data /app/data/targets /app/data/secrets /app/data/uploads && \
    chown -R appuser:appuser /app

USER appuser

# Hugging Face default is 7860; standard cloud default is 8000
EXPOSE 7860 8000

CMD ["sh", "-c", "python -m uvicorn app.main:app --app-dir FULL_CODE/backend --host 0.0.0.0 --port ${PORT:-7860} --proxy-headers --forwarded-allow-ips '*'"]
