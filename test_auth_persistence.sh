#!/bin/bash

# Test script for authentication persistence after app restart
# This script tests the admin login persistence functionality

echo "=== Testing Authentication Persistence After App Restart ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="http://localhost:8000"
FRONTEND_URL="http://localhost:5173"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin123"

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    if [ "$status" = "SUCCESS" ]; then
        echo -e "${GREEN}✓${NC} $message"
    elif [ "$status" = "ERROR" ]; then
        echo -e "${RED}✗${NC} $message"
    elif [ "$status" = "INFO" ]; then
        echo -e "${YELLOW}ℹ${NC} $message"
    fi
}

# Function to check if backend is running
check_backend() {
    print_status "INFO" "Checking if backend is running..."
    if curl -s -f "$BACKEND_URL/api/v1/articles/health/" > /dev/null 2>&1; then
        print_status "SUCCESS" "Backend is running"
        return 0
    else
        print_status "ERROR" "Backend is not running. Please start the backend first."
        return 1
    fi
}

# Function to check if frontend is running
check_frontend() {
    print_status "INFO" "Checking if frontend is running..."
    if curl -s -f "$FRONTEND_URL" > /dev/null 2>&1; then
        print_status "SUCCESS" "Frontend is running"
        return 0
    else
        print_status "ERROR" "Frontend is not running. Please start the frontend first."
        return 1
    fi
}

# Function to test login
test_login() {
    print_status "INFO" "Testing admin login..."
    
    # Create a temporary cookie jar
    COOKIE_JAR=$(mktemp)
    
    # Perform login
    LOGIN_RESPONSE=$(curl -s -c "$COOKIE_JAR" -X POST "$BACKEND_URL/api/v1/auth/login/" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$ADMIN_USERNAME\",\"password\":\"$ADMIN_PASSWORD\"}")
    
    if echo "$LOGIN_RESPONSE" | grep -q "Login successful"; then
        print_status "SUCCESS" "Login successful"
        
        # Extract session cookie
        SESSION_COOKIE=$(grep "sessionid" "$COOKIE_JAR" | awk '{print $7}')
        CSRF_COOKIE=$(grep "csrftoken" "$COOKIE_JAR" | awk '{print $7}')
        
        print_status "INFO" "Session cookie: $SESSION_COOKIE"
        print_status "INFO" "CSRF cookie: $CSRF_COOKIE"
        
        # Test session validation
        VALIDATION_RESPONSE=$(curl -s -b "$COOKIE_JAR" "$BACKEND_URL/api/v1/auth/validate-session/")
        if echo "$VALIDATION_RESPONSE" | grep -q '"valid":true'; then
            print_status "SUCCESS" "Session validation successful"
        else
            print_status "ERROR" "Session validation failed"
        fi
        
        # Test user endpoint
        USER_RESPONSE=$(curl -s -b "$COOKIE_JAR" "$BACKEND_URL/api/v1/auth/user/")
        if echo "$USER_RESPONSE" | grep -q '"username"'; then
            print_status "SUCCESS" "User endpoint accessible"
        else
            print_status "ERROR" "User endpoint not accessible"
        fi
        
        # Clean up
        rm -f "$COOKIE_JAR"
        return 0
    else
        print_status "ERROR" "Login failed: $LOGIN_RESPONSE"
        rm -f "$COOKIE_JAR"
        return 1
    fi
}

# Function to test session persistence
test_session_persistence() {
    print_status "INFO" "Testing session persistence..."
    
    # Create a temporary cookie jar
    COOKIE_JAR=$(mktemp)
    
    # Perform login
    curl -s -c "$COOKIE_JAR" -X POST "$BACKEND_URL/api/v1/auth/login/" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$ADMIN_USERNAME\",\"password\":\"$ADMIN_PASSWORD\"}" > /dev/null
    
    # Wait a moment
    sleep 2
    
    # Test session validation with stored cookies
    VALIDATION_RESPONSE=$(curl -s -b "$COOKIE_JAR" "$BACKEND_URL/api/v1/auth/validate-session/")
    if echo "$VALIDATION_RESPONSE" | grep -q '"valid":true'; then
        print_status "SUCCESS" "Session persistence working"
    else
        print_status "ERROR" "Session persistence failed: $VALIDATION_RESPONSE"
    fi
    
    # Clean up
    rm -f "$COOKIE_JAR"
}

# Function to test Redis session storage
test_redis_session() {
    print_status "INFO" "Testing Redis session storage..."
    
    # Check if Redis is running
    if command -v redis-cli > /dev/null 2>&1; then
        if redis-cli ping > /dev/null 2>&1; then
            print_status "SUCCESS" "Redis is running"
            
            # Check session keys
            SESSION_KEYS=$(redis-cli keys "*session*" | wc -l)
            print_status "INFO" "Found $SESSION_KEYS session keys in Redis"
        else
            print_status "ERROR" "Redis is not running"
        fi
    else
        print_status "INFO" "Redis CLI not available, skipping Redis test"
    fi
}

# Main test execution
main() {
    echo "Starting authentication persistence tests..."
    echo ""
    
    # Check if services are running
    if ! check_backend; then
        exit 1
    fi
    
    if ! check_frontend; then
        exit 1
    fi
    
    echo ""
    
    # Run tests
    test_login
    echo ""
    
    test_session_persistence
    echo ""
    
    test_redis_session
    echo ""
    
    print_status "INFO" "Authentication persistence tests completed!"
    print_status "INFO" "To test app restart persistence:"
    print_status "INFO" "1. Login to admin panel"
    print_status "INFO" "2. Restart the backend service"
    print_status "INFO" "3. Refresh the frontend page"
    print_status "INFO" "4. Verify you're still logged in"
}

# Run main function
main "$@"
