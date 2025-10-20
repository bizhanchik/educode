# ===========================================
# EduCode Backend Dockerfile (Optimized)
# ===========================================

# ---------- Base build stage ----------
FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PATH="/opt/venv/bin:$PATH"
    
    # Install only what's needed to build wheels
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*
    
RUN python -m venv /opt/venv
    
    # ---------- Dependencies stage ----------
FROM base AS deps
    
WORKDIR /tmp
    
    # ✅ копируем только requirements.txt, чтобы кэшировалось
COPY requirements.txt .
    
    # ✅ используем кеш для pip, чтобы не перекачивать torch и т.п.
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --upgrade pip && \
    pip install -r requirements.txt
    
    # ---------- Runtime (production) stage ----------
FROM python:3.11-slim AS runtime
    
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH"
    
RUN apt-get update && apt-get install -y \
    curl \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean
    
RUN groupadd -r educode && useradd -r -g educode educode
    
    # ✅ копируем только готовое окружение
COPY --from=deps /opt/venv /opt/venv
    
WORKDIR /app
COPY . .
    
RUN mkdir -p /app/logs /app/uploads && \
    chown -R educode:educode /app
    
USER educode
    
EXPOSE 8000
    
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1
    
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
    