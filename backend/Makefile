.PHONY: help up down restart logs build clean migrate seed shell test lint fmt smoke health

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
NC := \033[0m # No Color

## help: Show this help message
help:
	@echo "$(BLUE)EduCode Backend - Available Commands$(NC)"
	@echo ""
	@echo "$(GREEN)Docker Commands:$(NC)"
	@echo "  make up          - Start all services"
	@echo "  make down        - Stop all services"
	@echo "  make restart     - Restart all services"
	@echo "  make logs        - Show logs (all services)"
	@echo "  make build       - Rebuild Docker images"
	@echo "  make clean       - Stop services and remove volumes"
	@echo ""
	@echo "$(GREEN)Database Commands:$(NC)"
	@echo "  make migrate     - Run database migrations"
	@echo "  make seed        - Seed database with test data"
	@echo "  make shell       - Open database shell"
	@echo ""
	@echo "$(GREEN)Development Commands:$(NC)"
	@echo "  make test        - Run all tests"
	@echo "  make lint        - Run linters (ruff, flake8)"
	@echo "  make fmt         - Format code (black, isort)"
	@echo "  make smoke       - Run smoke tests"
	@echo ""
	@echo "$(GREEN)Health Commands:$(NC)"
	@echo "  make health      - Check service health"
	@echo ""

## up: Start all Docker services
up:
	@echo "$(BLUE)🚀 Starting EduCode services...$(NC)"
	docker compose up -d
	@echo "$(GREEN)✅ Services started$(NC)"
	@echo "API: http://localhost:8000"
	@echo "Docs: http://localhost:8000/docs"
	@echo "MinIO Console: http://localhost:9001"

## down: Stop all Docker services
down:
	@echo "$(YELLOW)🛑 Stopping EduCode services...$(NC)"
	docker compose down
	@echo "$(GREEN)✅ Services stopped$(NC)"

## restart: Restart all Docker services
restart: down up

## logs: Show logs from all services
logs:
	docker compose logs -f

## logs-api: Show API logs only
logs-api:
	docker compose logs -f api

## logs-worker: Show Celery worker logs
logs-worker:
	docker compose logs -f celery_worker

## logs-beat: Show Celery beat logs
logs-beat:
	docker compose logs -f celery_beat

## build: Rebuild Docker images
build:
	@echo "$(BLUE)🔨 Building Docker images...$(NC)"
	docker compose build
	@echo "$(GREEN)✅ Build complete$(NC)"

## clean: Stop services and remove volumes
clean:
	@echo "$(YELLOW)🧹 Cleaning up...$(NC)"
	docker compose down -v
	@echo "$(GREEN)✅ Cleanup complete$(NC)"

## migrate: Run Alembic migrations
migrate:
	@echo "$(BLUE)🔄 Running database migrations...$(NC)"
	docker compose exec api alembic upgrade head
	@echo "$(GREEN)✅ Migrations complete$(NC)"

## migrate-create: Create a new migration
migrate-create:
	@read -p "Enter migration message: " msg; \
	docker compose exec api alembic revision --autogenerate -m "$$msg"

## migrate-down: Rollback one migration
migrate-down:
	docker compose exec api alembic downgrade -1

## seed: Seed database with test data
seed:
	@echo "$(BLUE)🌱 Seeding database...$(NC)"
	docker compose exec api python scripts/seed.py
	@echo "$(GREEN)✅ Database seeded$(NC)"
	@echo ""
	@echo "$(GREEN)Login credentials:$(NC)"
	@echo "  Admin:    admin@educode.io / Passw0rd!"
	@echo "  Teacher:  teacher@educode.io / Passw0rd!"
	@echo "  Student:  student1@educode.io / Passw0rd!"

## shell: Open PostgreSQL shell
shell:
	docker compose exec postgres psql -U educode_user -d educode_db

## shell-api: Open API container shell
shell-api:
	docker compose exec api /bin/bash

## shell-redis: Open Redis CLI
shell-redis:
	docker compose exec redis redis-cli

## test: Run all tests
test:
	@echo "$(BLUE)🧪 Running tests...$(NC)"
	docker compose exec api pytest -v --cov=app --cov-report=term-missing
	@echo "$(GREEN)✅ Tests complete$(NC)"

## test-unit: Run unit tests only
test-unit:
	docker compose exec api pytest tests/test_auth.py tests/test_health.py -v

## test-integration: Run integration tests
test-integration:
	docker compose exec api pytest tests/test_crud.py tests/test_submissions.py -v

## lint: Run linters
lint:
	@echo "$(BLUE)🔍 Running linters...$(NC)"
	@docker compose exec api ruff check app/ || true
	@docker compose exec api flake8 app/ --max-line-length=120 --exclude=venv,__pycache__ || true
	@echo "$(GREEN)✅ Linting complete$(NC)"

## fmt: Format code
fmt:
	@echo "$(BLUE)✨ Formatting code...$(NC)"
	docker compose exec api black app/ scripts/ tests/
	docker compose exec api isort app/ scripts/ tests/
	@echo "$(GREEN)✅ Formatting complete$(NC)"

## smoke: Run smoke tests
smoke:
	@echo "$(BLUE)🧪 Running smoke tests...$(NC)"
	@bash scripts/smoke.sh || true

## health: Check service health
health:
	@echo "$(BLUE)🏥 Checking service health...$(NC)"
	@echo ""
	@echo "API Health:"
	@curl -s http://localhost:8000/api/v1/health | jq '.' || echo "❌ API not responding"
	@echo ""
	@echo "Database:"
	@docker compose exec postgres pg_isready -U educode_user || echo "❌ Database not ready"
	@echo ""
	@echo "Redis:"
	@docker compose exec redis redis-cli ping || echo "❌ Redis not responding"
	@echo ""
	@echo "MinIO:"
	@curl -s http://localhost:9000/minio/health/live > /dev/null && echo "✅ MinIO is healthy" || echo "❌ MinIO not responding"

## setup: Complete setup (build, up, migrate, seed)
setup: build up
	@echo "$(YELLOW)⏳ Waiting for services to start...$(NC)"
	@sleep 10
	@make migrate
	@make seed
	@echo ""
	@echo "$(GREEN)🎉 Setup complete!$(NC)"
	@echo "Visit: http://localhost:8000/docs"

## reset: Clean, rebuild, and setup everything
reset: clean setup
	@echo "$(GREEN)🔄 Complete reset done!$(NC)"

## status: Show Docker container status
status:
	docker compose ps

## version: Show version information
version:
	@echo "EduCode Backend v1.0.0"
	@echo "Python: $$(docker compose exec api python --version)"
	@echo "FastAPI: $$(docker compose exec api python -c 'import fastapi; print(fastapi.__version__)')"
