#!/bin/bash

echo "🧪 Running Pre-Production Tests for Dhivehinoos V2"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to run tests and check results
run_tests() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "\n${YELLOW}Running $test_name...${NC}"
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ $test_name passed${NC}"
        return 0
    else
        echo -e "${RED}❌ $test_name failed${NC}"
        return 1
    fi
}

# Track overall success
overall_success=true

# Backend Django Tests
echo -e "\n${YELLOW}🔧 Backend Tests${NC}"
cd backend

# Run Django tests
if run_tests "Django Settings Tests" "python manage.py test settings_app.tests"; then
    echo "Settings functionality tests passed"
else
    echo "Settings functionality tests failed"
    overall_success=false
fi

if run_tests "Django Ads Tests" "python manage.py test ads.tests"; then
    echo "Ads functionality tests passed"
else
    echo "Ads functionality tests failed"
    overall_success=false
fi

# Run all Django tests
if run_tests "All Django Tests" "python manage.py test"; then
    echo "All Django tests passed"
else
    echo "Some Django tests failed"
    overall_success=false
fi

cd ..

# Frontend Tests
echo -e "\n${YELLOW}🎨 Frontend Tests${NC}"
cd frontend

# Install test dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Check if vitest is available
if ! command -v npx vitest &> /dev/null; then
    echo "Installing Vitest..."
    npm install --save-dev vitest @vitest/ui @testing-library/jest-dom @testing-library/react @testing-library/user-event jsdom
fi

# Run frontend tests
if run_tests "Frontend Component Tests" "npx vitest --run"; then
    echo "Frontend component tests passed"
else
    echo "Frontend component tests failed"
    overall_success=false
fi

cd ..

# Summary
echo -e "\n${YELLOW}📊 Test Summary${NC}"
echo "=================="

if [ "$overall_success" = true ]; then
    echo -e "${GREEN}🎉 All tests passed! Ready for production.${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Please fix issues before deploying.${NC}"
    exit 1
fi
