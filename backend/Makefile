# EduCode Backend - Makefile for common commands

.PHONY: help build up down restart logs shell migrate migrate-create backup restore clean test

# Default target
help:
	@echo "EduCode Backend - Available Commands:"
	@echo ""
	@echo "  make build           - Build all Docker containers"
	@echo "  make up              - Start all services"
	@echo "  make down            - Stop all services"
	@echo "  make restart         - Restart all services"
	@echo "  make logs            - View all logs"
	@echo "  make logs-backend    - View backend logs"
	@echo "  make logs-celery     - View Celery worker logs"
	@echo "  make shell           - Open shell in backend container"
	@echo "  make migrate         - Run database migrations"
	@echo "  make migrate-create  - Create a new migration"
	@echo "  make backup          - Backup database"
	@echo "  make restore         - Restore database from backup"
	@echo "  make clean           - Remove all containers and volumes"
	@echo "  make test            - Run tests"
	@echo "  make dev             - Start in development mode"
	@echo ""

# Build containers
build:
	docker-compose build

# Start services
up:
	docker-compose up -d
	@echo "Services started! Access the API at http://localhost:8000/docs"

# Start in development mode (with logs)
dev:
	docker-compose up

# Stop services
down:
	docker-compose down

# Restart services
restart:
	docker-compose restart

# View all logs
logs:
	docker-compose logs -f

# View backend logs
logs-backend:
	docker-compose logs -f backend

# View Celery logs
logs-celery:
	docker-compose logs -f celery_worker

# Open shell in backend container
shell:
	docker-compose exec backend bash

# Run database migrations
migrate:
	docker-compose exec backend alembic upgrade head

# Create a new migration
migrate-create:
	@read -p "Migration description: " desc; \
	docker-compose exec backend alembic revision --autogenerate -m "$$desc"

# Rollback migration
migrate-rollback:
	docker-compose exec backend alembic downgrade -1

# Show migration status
migrate-status:
	docker-compose exec backend alembic current
	docker-compose exec backend alembic history

# Backup database
backup:
	@mkdir -p backups
	docker-compose exec postgres pg_dump -U educode_user educode_db > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "Database backed up to backups/"

# Restore database
restore:
	@echo "Available backups:"
	@ls -1 backups/*.sql 2>/dev/null || echo "No backups found"
	@read -p "Enter backup filename: " file; \
	docker-compose exec -T postgres psql -U educode_user educode_db < "$$file"

# Clean everything
clean:
	docker-compose down -v
	@echo "All containers and volumes removed!"

# Clean and rebuild
rebuild: clean build up

# Run tests
test:
	docker-compose exec backend pytest

# Run tests with coverage
test-cov:
	docker-compose exec backend pytest --cov=app --cov-report=html

# Check service status
status:
	docker-compose ps

# View resource usage
stats:
	docker stats

# Open PostgreSQL CLI
db-shell:
	docker-compose exec postgres psql -U educode_user -d educode_db

# Open Redis CLI
redis-shell:
	docker-compose exec redis redis-cli

# Setup environment file
setup-env:
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo ".env file created! Please update the values."; \
	else \
		echo ".env file already exists!"; \
	fi

# Full setup from scratch
setup: setup-env build up migrate
	@echo "Setup complete! Access the API at http://localhost:8000/docs"

# Scale Celery workers
scale-workers:
	@read -p "Number of workers: " count; \
	docker-compose up -d --scale celery_worker=$$count

# View Flower (Celery monitor)
flower:
	@echo "Opening Flower at http://localhost:5555"
	@open http://localhost:5555 || xdg-open http://localhost:5555 || echo "Please visit http://localhost:5555"

# View API docs
docs:
	@echo "Opening API docs at http://localhost:8000/docs"
	@open http://localhost:8000/docs || xdg-open http://localhost:8000/docs || echo "Please visit http://localhost:8000/docs"

# View MinIO console
minio:
	@echo "Opening MinIO console at http://localhost:9001"
	@open http://localhost:9001 || xdg-open http://localhost:9001 || echo "Please visit http://localhost:9001"
