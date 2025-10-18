# ==========================================
# FastAPI + UV (Python 3.12)
# ==========================================

FROM python:3.12-slim

# Install UV (fast Python package manager)
RUN pip install --no-cache-dir uv

WORKDIR /app

# Copy dependency files
COPY pyproject.toml ./

# Install dependencies with UV (including dev dependencies for testing)
RUN uv pip install --system -r pyproject.toml
RUN uv pip install --system pytest pytest-asyncio httpx pytest-cov

# Copy application code
COPY app ./app

# Copy tests
COPY tests ./tests

# Copy Alembic migrations
COPY alembic ./alembic
COPY alembic.ini ./alembic.ini

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

# Run FastAPI with uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
