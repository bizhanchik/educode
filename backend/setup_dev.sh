#!/bin/bash
# EduCode Development Environment Setup Script

set -e  # Exit on error

echo "=========================================="
echo "EduCode Development Environment Setup"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}✗ .env file not found!${NC}"
    echo "Please create a .env file from .env.example"
    exit 1
fi

echo -e "${GREEN}✓ .env file found${NC}"
echo ""

# Step 1: Install Python dependencies
echo "Step 1: Installing Python dependencies..."
pip install -r requirements.txt
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 2: Initialize database
echo "Step 2: Initializing database..."
python init_db.py
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database initialized${NC}"
else
    echo -e "${RED}✗ Database initialization failed${NC}"
    echo "Please check the error messages above"
    exit 1
fi
echo ""

# Step 3: Run migrations
echo "Step 3: Running Alembic migrations..."
alembic upgrade head
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Migrations completed${NC}"
else
    echo -e "${RED}✗ Migrations failed${NC}"
    echo "Please check the error messages above"
    exit 1
fi
echo ""

# Step 4: Check Redis connection
echo "Step 4: Checking Redis connection..."
if command -v redis-cli &> /dev/null; then
    if redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Redis is running${NC}"
    else
        echo -e "${YELLOW}⚠ Redis is not running${NC}"
        echo "Start Redis with: redis-server"
        echo "Or if using Docker: docker-compose up -d redis"
    fi
else
    echo -e "${YELLOW}⚠ redis-cli not found${NC}"
    echo "Redis check skipped"
fi
echo ""

echo "=========================================="
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Start the backend server:"
echo "   python -m app.main"
echo ""
echo "2. Start Celery worker (in another terminal):"
echo "   celery -A app.tasks.celery_app worker --loglevel=info"
echo ""
echo "3. (Optional) Start Celery beat for scheduled tasks:"
echo "   celery -A app.tasks.celery_app beat --loglevel=info"
echo ""
echo "4. Access the API docs:"
echo "   http://localhost:8000/docs"
echo ""
echo "5. Start the frontend (in another terminal):"
echo "   cd ../frontend && npm run dev"
echo ""
