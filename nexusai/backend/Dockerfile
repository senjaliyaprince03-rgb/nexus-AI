# ── Stage 1: base ─────────────────────────────────────────────────────────────
FROM python:3.11-slim AS base

# System deps: curl for healthcheck, build-essential for C extensions,
# and libmagic for python-magic MIME detection on Linux.
RUN apt-get update && apt-get install -y --no-install-recommends \
      curl \
      build-essential \
      libmagic1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# ── Stage 2: dependencies ──────────────────────────────────────────────────────
FROM base AS deps

COPY pyproject.toml .
# Install all deps including dev extras so the image can run tests
RUN pip install -e ".[dev]"

# ── Stage 3: development ───────────────────────────────────────────────────────
# Used by docker-compose. Source is mounted as a volume — no COPY needed.
FROM deps AS development

# Pre-download the sentence-transformers model so the first request is fast.
# This bakes the model into the image layer (~90 MB).
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')" || true

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# ── Stage 4: production ────────────────────────────────────────────────────────
FROM deps AS production

COPY . .

# Run as non-root
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
USER appuser

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
