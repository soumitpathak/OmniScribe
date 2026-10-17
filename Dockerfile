# ==============================================================================
# OmniScribe - Autonomous Logistics Regulatory Compliance Agent
# Production Multi-Stage Dockerfile for Google Cloud Run
# ==============================================================================

# --- Stage 1: Build Frontend (Vite + React + Tailwind CSS) ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app

#COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# --- Stage 2: Python FastAPI Backend & Runtime ---
FROM python:3.11-slim AS production

# Set environment variables for Python & Cloud Run
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend/ ./backend/
COPY --from=frontend-builder /app/dist ./dist

# Create a non-root user for security best practices on Cloud Run
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Cloud Run injects PORT environment variable (default 8080)
EXPOSE 8080

# Run Uvicorn pointing to backend.main:app
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8080} --workers 2"]
