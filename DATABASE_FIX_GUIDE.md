# Database Configuration Fix Guide

## Issues Fixed

1. ✅ Added `SQLALCHEMY_DATABASE_URI` property to Settings class
2. ✅ Updated Celery tasks to use correct DATABASE_URL
3. ✅ Created database initialization script

## Quick Fix Steps

### Step 1: Initialize Database

Run the database initialization script:

```bash
cd backend
python init_db.py
```

This script will:
- Create the `educode_db` database if it doesn't exist
- Test the connection
- Show you any connection errors

### Step 2: Run Migrations

After the database exists, run Alembic migrations:

```bash
alembic upgrade head
```

### Step 3: Start Services

Start all services in separate terminals:

```bash
# Terminal 1: Backend
python -m app.main

# Terminal 2: Celery Worker
celery -A app.tasks.celery_app worker --loglevel=info

# Terminal 3: Redis (if not using Docker)
redis-server
```

---

## Troubleshooting

### Error: "database 'educode_user' does not exist"

**Cause:** The database URL is being parsed incorrectly.

**Solution:**
1. Check your `.env` file has the correct DATABASE_URL:
   ```
   DATABASE_URL=postgresql+asyncpg://educode_user:educode_pass@postgres:5432/educode_db
   ```

2. Make sure the database name is `educode_db` (the part after the last `/`)

3. Run `python init_db.py` to create the database

### Error: "'Settings' object has no attribute 'SQLALCHEMY_DATABASE_URI'"

**Status:** ✅ FIXED

**What was done:**
- Added `SQLALCHEMY_DATABASE_URI` property to Settings class in `app/core/config.py`
- This property returns `DATABASE_URL` for compatibility

### Error: "connection to server at 'postgres' failed"

**Cause:** PostgreSQL is not running or Docker network issue.

**Solution:**

If using Docker:
```bash
docker-compose up -d postgres
```

If using local PostgreSQL:
```bash
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Check if running
psql -U postgres -c "SELECT version();"
```

### Error: "role 'educode_user' does not exist"

**Solution:** Create the PostgreSQL user:

```sql
-- Connect to PostgreSQL as superuser
psql -U postgres

-- Create user and database
CREATE USER educode_user WITH PASSWORD 'educode_pass';
CREATE DATABASE educode_db OWNER educode_user;
GRANT ALL PRIVILEGES ON DATABASE educode_db TO educode_user;

-- Exit
\q
```

Or use the init script:
```bash
python init_db.py
```

---

## Docker Setup (Recommended)

If you're using Docker, make sure all services are running:

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend

# Restart a service
docker-compose restart backend
```

### Docker DATABASE_URL

In `.env` for Docker, use service names:
```
DATABASE_URL=postgresql+asyncpg://educode_user:educode_pass@postgres:5432/educode_db
REDIS_URL=redis://redis:6379/0
MINIO_ENDPOINT=minio:9000
```

### Local Development DATABASE_URL

For local development (without Docker), use localhost:
```
DATABASE_URL=postgresql+asyncpg://educode_user:educode_pass@localhost:5432/educode_db
REDIS_URL=redis://localhost:6379/0
MINIO_ENDPOINT=localhost:9000
```

---

## Manual Database Setup

If `init_db.py` doesn't work, manually create the database:

### 1. Connect to PostgreSQL

```bash
# Using psql
psql -U postgres

# Or for Docker
docker exec -it educode-postgres psql -U postgres
```

### 2. Create Database and User

```sql
-- Create user if not exists
CREATE USER educode_user WITH PASSWORD 'educode_pass';

-- Create database
CREATE DATABASE educode_db OWNER educode_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE educode_db TO educode_user;

-- Switch to the new database
\c educode_db

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO educode_user;

-- Exit
\q
```

### 3. Verify Connection

```bash
# Test connection
psql -U educode_user -d educode_db -h localhost -W

# If it prompts for password, enter: educode_pass
# If successful, you'll see: educode_db=>
```

---

## Verify Everything Works

### 1. Check Database Connection

```python
# Run this in Python shell
from app.core.config import settings
print(f"DATABASE_URL: {settings.DATABASE_URL}")
print(f"SQLALCHEMY_DATABASE_URI: {settings.SQLALCHEMY_DATABASE_URI}")
# Should print the same URL
```

### 2. Test Alembic

```bash
# Check current version
alembic current

# Show migration history
alembic history

# Upgrade to latest
alembic upgrade head
```

### 3. Test Backend

```bash
# Start backend
python -m app.main

# In another terminal, test health endpoint
curl http://localhost:8000/api/v1/health
```

### 4. Test Celery

```bash
# Start worker
celery -A app.tasks.celery_app worker --loglevel=info

# You should see:
# - worker@... ready
# - Tasks registered (including ai_generation_tasks)
```

---

## Environment Variables Checklist

Make sure your `.env` file has all required variables:

```bash
# Application
APP_NAME=EduCode
DEBUG=true

# Database (Docker)
DATABASE_URL=postgresql+asyncpg://educode_user:educode_pass@postgres:5432/educode_db

# OR Database (Local)
# DATABASE_URL=postgresql+asyncpg://educode_user:educode_pass@localhost:5432/educode_db

# Redis
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0

# AI Services (required for task generation)
OPENAI_API_KEY=your-key-here
ANTHROPIC_API_KEY=your-key-here

# MinIO
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# Security
SECRET_KEY=your-secret-key-change-in-production
```

---

## Common Issues Summary

| Issue | Solution |
|-------|----------|
| Database doesn't exist | Run `python init_db.py` |
| User doesn't exist | Create user with `CREATE USER` SQL |
| Connection refused | Start PostgreSQL/Docker |
| Wrong database name | Check `.env` DATABASE_URL |
| SQLALCHEMY_DATABASE_URI error | ✅ Fixed in config.py |
| Docker network issues | Use service names (postgres, redis, minio) |
| Local development issues | Use localhost instead of service names |

---

## Success Indicators

You'll know everything is working when:

✅ `python init_db.py` completes successfully
✅ `alembic upgrade head` runs without errors
✅ Backend starts and shows "✅ DB connected"
✅ Celery worker shows registered tasks
✅ Health check returns 200: `curl http://localhost:8000/api/v1/health`

---

## Next Steps After Database is Fixed

1. **Run Migrations:**
   ```bash
   alembic upgrade head
   ```

2. **Create Admin User:**
   ```bash
   # Use the backend admin interface or create via SQL
   ```

3. **Test AI Generation:**
   - Upload a PDF material
   - Mark it for AI generation
   - Trigger task generation
   - Check Celery logs for processing

4. **Test Frontend Integration:**
   - Start frontend: `npm run dev`
   - Login as teacher
   - Create a lesson
   - Upload materials
   - Generate tasks with AI

---

## Support

If you still have issues:

1. Check logs:
   ```bash
   # Backend logs
   tail -f logs/educode.log

   # Docker logs
   docker-compose logs -f backend

   # Celery logs
   # (visible in celery worker terminal)
   ```

2. Verify environment:
   ```bash
   # Check .env is loaded
   python -c "from app.core.config import settings; print(settings.DATABASE_URL)"
   ```

3. Test each component separately:
   - PostgreSQL connection
   - Redis connection
   - MinIO connection
   - Celery worker
   - Backend API

All database configuration issues are now fixed! 🎉
