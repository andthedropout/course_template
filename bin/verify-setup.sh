#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "======================================"
echo "Django + React Template Setup Verification"
echo "======================================"
echo ""

# Track if any errors occurred
ERRORS=0

# Check required files exist
echo "Checking required files..."
FILES=("compose.yaml" ".env" "pyproject.toml" "requirements.txt" "frontend/package.json")
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file exists"
    else
        echo -e "${RED}✗${NC} Missing: $file"
        ERRORS=$((ERRORS + 1))
    fi
done
echo ""

# Check if Docker is running
echo "Checking Docker..."
if docker info > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Docker is running"
else
    echo -e "${RED}✗${NC} Docker is not running"
    echo "  Please start Docker Desktop and try again"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check if .env has been configured
echo "Checking environment configuration..."
if grep -q "COMPOSE_PROJECT_NAME=starter_django_react" .env 2>/dev/null; then
    echo -e "${YELLOW}⚠${NC}  COMPOSE_PROJECT_NAME is set to default 'starter_django_react'"
    echo "  Consider changing this to your project name to avoid container conflicts"
elif grep -q "COMPOSE_PROJECT_NAME=" .env 2>/dev/null; then
    PROJECT_NAME=$(grep "COMPOSE_PROJECT_NAME=" .env | cut -d= -f2)
    echo -e "${GREEN}✓${NC} COMPOSE_PROJECT_NAME is set to: $PROJECT_NAME"
else
    echo -e "${RED}✗${NC} COMPOSE_PROJECT_NAME not found in .env"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check Docker containers
echo "Checking Docker containers..."
if docker compose ps --format "table {{.Name}}\t{{.Status}}" 2>/dev/null | grep -q "Up"; then
    echo -e "${GREEN}✓${NC} Containers are running:"
    docker compose ps --format "table {{.Name}}\t{{.Status}}" | grep "Up"

    # Check if web container is responding
    echo ""
    echo "Testing web server..."
    if curl -f http://localhost:8000 > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Web server is responding at http://localhost:8000"
    else
        echo -e "${RED}✗${NC} Web server not responding at http://localhost:8000"
        echo "  Check logs: docker compose logs web"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${YELLOW}⚠${NC}  No containers are running"
    echo "  Start them with: docker compose up -d"
fi
echo ""

# Check migrations (only if web container is running)
if docker compose ps web --format "{{.Status}}" 2>/dev/null | grep -q "Up"; then
    echo "Checking migrations..."
    UNAPPLIED=$(docker compose exec -T web python manage.py showmigrations 2>/dev/null | grep "\[ \]" | wc -l)
    if [ "$UNAPPLIED" -eq 0 ]; then
        echo -e "${GREEN}✓${NC} All migrations are applied"
    else
        echo -e "${YELLOW}⚠${NC}  You have $UNAPPLIED unapplied migration(s)"
        echo "  Run: docker compose exec web python manage.py migrate"
    fi
    echo ""
fi

# Check for common issues
echo "Checking for common issues..."

# Check node_modules volume
if docker volume ls | grep -q "node_modules"; then
    echo -e "${GREEN}✓${NC} node_modules volume exists"
else
    echo -e "${YELLOW}⚠${NC}  node_modules volume not found (will be created on first run)"
fi

# Check frontend/dist directory
if [ -d "frontend/dist" ]; then
    echo -e "${GREEN}✓${NC} frontend/dist exists (production build present)"
else
    echo -e "${YELLOW}⚠${NC}  frontend/dist not found (normal for development)"
fi

echo ""
echo "======================================"

# Summary
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}Setup verification complete - No critical errors!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Start containers: docker compose up"
    echo "2. Access app: http://localhost:8000"
    echo "3. Django admin: http://localhost:8000/admin"
    exit 0
else
    echo -e "${RED}Setup verification found $ERRORS error(s)${NC}"
    echo ""
    echo "Please fix the errors above and try again."
    echo "For help, see README.md or .claude/CLAUDE.md"
    exit 1
fi
