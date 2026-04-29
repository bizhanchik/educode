# EduCode Backend - Quick Start Guide

Get your EduCode backend up and running in 5 minutes!

## Prerequisites

- Docker and Docker Compose installed
- Git installed

## Setup Steps

### 1. Navigate to Project

```bash
cd educode_backend
```

### 2. Create Environment File

```bash
cp .env.example .env
```

### 3. Edit .env File

Open `.env` and update these critical values:

```bash
# Generate a secret key
SECRET_KEY=$(openssl rand -hex 32)

# Add your API keys
OPENAI_API_KEY=your-openai-key-here
ANTHROPIC_API_KEY=your-anthropic-key-here
```

### 4. Start Everything with One Command

```bash
make setup
```

Or manually:

```bash
docker-compose up -d
```

### 5. Verify It's Running

```bash
# Check service status
make status

# Or
docker-compose ps
```

All services should show "Up" status.

## Access Your Application

- **API Documentation**: http://localhost:8000/docs
- **API Alternative Docs**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/api/v1/health
- **Celery Monitor (Flower)**: http://localhost:5555
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)

## Common Commands

```bash
# View logs
make logs

# Run migrations
make migrate

# Stop everything
make down

# Restart services
make restart

# Open backend shell
make shell

# Backup database
make backup
```

## What Was Fixed?

1. **Duplicate main.py** - Removed the duplicate root-level `main.py`. The correct entry point is `app/main.py`

2. **Docker Setup** - Created:
   - `Dockerfile` - Multi-stage build for optimized images
   - `docker-compose.yml` - Full stack with PostgreSQL, Redis, MinIO, Celery
   - `.dockerignore` - Optimized build context

3. **Database Migrations** - Configured Alembic:
   - Auto-runs migrations on container start
   - Configured for async PostgreSQL with asyncpg
   - All models properly imported

4. **Environment Configuration**:
   - `.env.example` - Template with all settings documented
   - `init-db.sql` - PostgreSQL initialization script

5. **Documentation**:
   - `DEPLOYMENT.md` - Complete deployment guide
   - `QUICKSTART.md` - This file!
   - `Makefile` - Convenient command shortcuts

## Architecture

Your deployment includes:

```
┌─────────────────┐
│   FastAPI App   │ :8000
│   (Backend)     │
└────────┬────────┘
         │
    ┌────┴────┬──────────┬──────────┐
    │         │          │          │
┌───▼───┐ ┌──▼──┐  ┌────▼────┐ ┌──▼────┐
│PostgreSQL Redis│  │  MinIO  │ │Celery │
│  :5432│ :6379│  │ :9000   │ │Worker │
└───────┘ └─────┘  └─────────┘ └───────┘
                                    │
                               ┌────▼────┐
                               │ Flower  │
                               │ :5555   │
                               └─────────┘
```

## Troubleshooting

### Services won't start?

```bash
# Check logs
make logs

# Rebuild everything
make rebuild
```

### Database connection errors?

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres
```

### Port conflicts?

Edit `.env` and change:
```bash
BACKEND_PORT=8080
POSTGRES_PORT=5433
```

### Need to reset everything?

```bash
make clean
make setup
```

## Next Steps

1. Test the API at http://localhost:8000/docs
2. Create your first user
3. Upload some test code
4. Check Celery tasks in Flower
5. Review `DEPLOYMENT.md` for production setup

## Support

For detailed documentation, see `DEPLOYMENT.md`.

For issues:
- Check logs: `make logs`
- Review service status: `make status`
- Reset everything: `make clean && make setup`

---

Happy coding! 🚀
