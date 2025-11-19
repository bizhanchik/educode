# EduCode Backend Deployment Guide

This guide provides comprehensive instructions for deploying the EduCode backend application using Docker.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Database Migrations](#database-migrations)
- [Running the Application](#running-the-application)
- [Production Deployment](#production-deployment)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying the EduCode backend, ensure you have the following installed:

- **Docker** (version 20.10 or higher)
- **Docker Compose** (version 2.0 or higher)
- **Git** (for cloning the repository)

### Verify Installation

```bash
docker --version
docker-compose --version
```

## Quick Start

Follow these steps to get the application running quickly:

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd educode_backend
```

### 2. Create Environment File

```bash
cp .env.example .env
```

### 3. Update Environment Variables

Edit the `.env` file and update the following critical values:

```bash
# IMPORTANT: Change these values for production!
SECRET_KEY=your-super-secret-key-change-this-in-production
OPENAI_API_KEY=your-openai-api-key-here
ANTHROPIC_API_KEY=your-anthropic-api-key-here
```

Generate a secure secret key:

```bash
openssl rand -hex 32
```

### 4. Start the Services

```bash
docker-compose up -d
```

This command will:
- Pull all required Docker images
- Build the backend application
- Start PostgreSQL, Redis, MinIO, and the backend services
- Run database migrations automatically

### 5. Verify Deployment

Check that all services are running:

```bash
docker-compose ps
```

You should see all services in the "Up" state.

### 6. Access the Application

- **API Documentation**: http://localhost:8000/docs
- **Alternative API Docs**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/api/v1/health
- **Flower (Celery Monitor)**: http://localhost:5555
- **MinIO Console**: http://localhost:9001 (login: minioadmin/minioadmin)

## Configuration

### Environment Variables

The application uses environment variables for configuration. All available options are documented in `.env.example`.

#### Critical Settings

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | Application secret key (MUST change in production) | - |
| `DATABASE_URL` | PostgreSQL connection string | Auto-configured |
| `REDIS_URL` | Redis connection string | Auto-configured |
| `OPENAI_API_KEY` | OpenAI API key for AI features | - |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude models | - |
| `ALLOWED_ORIGINS` | CORS allowed origins | http://localhost:3000 |

#### Optional Settings

| Variable | Description | Default |
|----------|-------------|---------|
| `DEBUG` | Enable debug mode | false |
| `LOG_LEVEL` | Logging level (DEBUG, INFO, WARNING, ERROR) | INFO |
| `MAX_FILE_SIZE_MB` | Maximum upload file size | 10 |
| `AI_SIMILARITY_THRESHOLD` | AI similarity detection threshold | 0.8 |

### Service Ports

The following ports are exposed by default:

- **8000**: Backend API
- **5432**: PostgreSQL database
- **6379**: Redis
- **9000**: MinIO S3 storage
- **9001**: MinIO console
- **5555**: Flower (Celery monitoring)

To change ports, update the `.env` file:

```bash
BACKEND_PORT=8080
POSTGRES_PORT=5433
```

## Database Migrations

### Understanding Migrations

The application uses **Alembic** for database migrations. Migrations are automatically run when the container starts, but you can also manage them manually.

### Automatic Migrations (Default)

Migrations run automatically when you start the backend service:

```bash
docker-compose up -d backend
```

### Manual Migration Management

#### Create a New Migration

```bash
# After modifying models, generate a new migration
docker-compose exec backend alembic revision --autogenerate -m "Description of changes"
```

#### Apply Migrations

```bash
# Upgrade to the latest version
docker-compose exec backend alembic upgrade head

# Upgrade to a specific revision
docker-compose exec backend alembic upgrade <revision_id>
```

#### Rollback Migrations

```bash
# Downgrade by one revision
docker-compose exec backend alembic downgrade -1

# Downgrade to a specific revision
docker-compose exec backend alembic downgrade <revision_id>
```

#### View Migration History

```bash
# Show current revision
docker-compose exec backend alembic current

# Show migration history
docker-compose exec backend alembic history
```

### Initial Migration

If you're setting up the database for the first time, create an initial migration:

```bash
# Generate initial migration
docker-compose exec backend alembic revision --autogenerate -m "Initial migration"

# Apply the migration
docker-compose exec backend alembic upgrade head
```

## Running the Application

### Development Mode

For development with auto-reload:

```bash
# Start all services
docker-compose up

# Or run in background
docker-compose up -d

# View logs
docker-compose logs -f backend
```

### Production Mode

For production deployment:

1. Update `.env`:
   ```bash
   DEBUG=false
   ENVIRONMENT=production
   LOG_LEVEL=WARNING
   ```

2. Use production-ready settings:
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

### Managing Services

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart a specific service
docker-compose restart backend

# View logs
docker-compose logs -f backend

# View all service logs
docker-compose logs -f

# Execute commands in a container
docker-compose exec backend bash
```

## Production Deployment

### Security Checklist

Before deploying to production:

- [ ] Change `SECRET_KEY` to a strong random value
- [ ] Set `DEBUG=false`
- [ ] Update `ALLOWED_ORIGINS` with your frontend domain
- [ ] Use strong database passwords
- [ ] Change MinIO credentials from defaults
- [ ] Set up HTTPS/TLS (use a reverse proxy like Nginx)
- [ ] Enable firewall rules
- [ ] Set up regular database backups
- [ ] Configure log rotation
- [ ] Review and restrict network access

### Recommended Production Setup

1. **Use a Reverse Proxy (Nginx/Traefik)**

   Add an Nginx container or use a cloud load balancer to handle:
   - SSL/TLS termination
   - Rate limiting
   - Static file serving
   - Request routing

2. **External Database (Recommended)**

   For production, consider using managed database services:
   - AWS RDS
   - Google Cloud SQL
   - Azure Database for PostgreSQL

   Update `DATABASE_URL` in `.env` accordingly.

3. **Object Storage**

   Use cloud storage instead of MinIO:
   - AWS S3
   - Google Cloud Storage
   - Azure Blob Storage

4. **Monitoring and Logging**

   Set up monitoring services:
   - Application Performance Monitoring (APM)
   - Error tracking (Sentry)
   - Log aggregation (ELK stack, Datadog)

### Scaling

#### Horizontal Scaling

Scale Celery workers:

```bash
docker-compose up -d --scale celery_worker=3
```

#### Load Balancing

Use multiple backend instances behind a load balancer:

```bash
docker-compose up -d --scale backend=3
```

Then configure Nginx or a cloud load balancer to distribute traffic.

## Monitoring

### Health Checks

All services have health checks configured:

```bash
# Check service health
docker-compose ps

# Backend health endpoint
curl http://localhost:8000/api/v1/health
```

### Flower - Celery Monitoring

Access Flower at http://localhost:5555 to monitor:
- Active tasks
- Task history
- Worker status
- Task rates

### Logs

View application logs:

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend

# Follow logs with timestamps
docker-compose logs -f -t backend
```

### Database Monitoring

Connect to PostgreSQL:

```bash
docker-compose exec postgres psql -U educode_user -d educode_db
```

Check database size:

```sql
SELECT pg_size_pretty(pg_database_size('educode_db'));
```

## Troubleshooting

### Common Issues

#### 1. Services Won't Start

**Problem**: Containers fail to start or crash immediately.

**Solution**:
```bash
# Check logs
docker-compose logs backend

# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

#### 2. Database Connection Errors

**Problem**: Backend can't connect to PostgreSQL.

**Solution**:
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Verify DATABASE_URL in .env
# Ensure it uses 'postgres' as host (not localhost) in Docker

# Check PostgreSQL logs
docker-compose logs postgres
```

#### 3. Migration Errors

**Problem**: Alembic migrations fail.

**Solution**:
```bash
# Check migration status
docker-compose exec backend alembic current

# Try manual migration
docker-compose exec backend alembic upgrade head

# If stuck, check migration files in alembic/versions/
```

#### 4. Redis Connection Issues

**Problem**: Celery workers can't connect to Redis.

**Solution**:
```bash
# Check Redis is running
docker-compose ps redis

# Test Redis connection
docker-compose exec redis redis-cli ping

# Should return: PONG
```

#### 5. MinIO Access Issues

**Problem**: File uploads fail or MinIO is inaccessible.

**Solution**:
```bash
# Check MinIO is running
docker-compose ps minio

# Access MinIO console
# http://localhost:9001

# Create bucket manually if needed
# Login with credentials from .env
```

#### 6. Port Already in Use

**Problem**: "Port is already allocated" error.

**Solution**:
```bash
# Change ports in .env
BACKEND_PORT=8080
POSTGRES_PORT=5433

# Or stop the conflicting service
lsof -i :8000
kill -9 <PID>
```

#### 7. Out of Memory

**Problem**: Containers crash due to memory limits.

**Solution**:
```bash
# Increase Docker memory limit in Docker Desktop settings

# Or add memory limits to docker-compose.yml:
services:
  backend:
    mem_limit: 2g
```

### Reset Everything

If you need to start fresh:

```bash
# Stop and remove all containers, networks, and volumes
docker-compose down -v

# Remove all EduCode images
docker images | grep educode | awk '{print $3}' | xargs docker rmi

# Start fresh
docker-compose up -d --build
```

### Getting Help

View container details:

```bash
# Inspect a container
docker-compose exec backend env

# Check resource usage
docker stats

# Enter a container shell
docker-compose exec backend bash
```

## Backup and Restore

### Database Backup

```bash
# Create backup
docker-compose exec postgres pg_dump -U educode_user educode_db > backup.sql

# Or with docker cp
docker-compose exec postgres pg_dump -U educode_user educode_db > /tmp/backup.sql
docker cp educode_postgres:/tmp/backup.sql ./backup.sql
```

### Database Restore

```bash
# Restore from backup
docker-compose exec -T postgres psql -U educode_user educode_db < backup.sql
```

### Volume Backup

```bash
# Backup volumes
docker run --rm -v educode_backend_postgres_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/postgres-backup.tar.gz /data
```

## Next Steps

After successful deployment:

1. Test all API endpoints using the Swagger docs at `/docs`
2. Create an admin user
3. Configure AI service API keys
4. Set up monitoring and alerting
5. Configure automated backups
6. Review security settings
7. Set up CI/CD pipeline

## Support

For issues and questions:
- Check the logs: `docker-compose logs -f`
- Review this documentation
- Check the application README
- Open an issue in the repository

---

**Last Updated**: 2025-01-19
**Version**: 1.0.0
