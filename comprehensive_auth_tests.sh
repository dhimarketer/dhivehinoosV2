#!/bin/bash

# Comprehensive Authentication Test Script
# Tests all authentication flows and edge cases

echo "=== Comprehensive Authentication Test Suite ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="http://localhost:8000"
FRONTEND_URL="http://localhost:5173"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin123"

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    if [ "$status" = "SUCCESS" ]; then
        echo -e "${GREEN}✓${NC} $message"
        ((TESTS_PASSED++))
    elif [ "$status" = "ERROR" ]; then
        echo -e "${RED}✗${NC} $message"
        ((TESTS_FAILED++))
    elif [ "$status" = "INFO" ]; then
        echo -e "${YELLOW}ℹ${NC} $message"
    elif [ "$status" = "TEST" ]; then
        echo -e "${BLUE}🧪${NC} $message"
    fi
    ((TOTAL_TESTS++))
}

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    print_status "TEST" "Running: $test_name"
    
    if eval "$test_command" > /dev/null 2>&1; then
        if [ "$expected_result" = "success" ]; then
            print_status "SUCCESS" "$test_name - PASSED"
        else
            print_status "ERROR" "$test_name - FAILED (Expected failure but got success)"
        fi
    else
        if [ "$expected_result" = "failure" ]; then
            print_status "SUCCESS" "$test_name - PASSED"
        else
            print_status "ERROR" "$test_name - FAILED (Expected success but got failure)"
        fi
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

# Test 1: Basic login functionality
test_basic_login() {
    echo ""
    print_status "INFO" "=== Testing Basic Login Functionality ==="
    
    # Create a temporary cookie jar
    COOKIE_JAR=$(mktemp)
    
    # Test successful login
    LOGIN_RESPONSE=$(curl -s -c "$COOKIE_JAR" -X POST "$BACKEND_URL/api/v1/auth/login/" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$ADMIN_USERNAME\",\"password\":\"$ADMIN_PASSWORD\"}")
    
    if echo "$LOGIN_RESPONSE" | grep -q "Login successful"; then
        print_status "SUCCESS" "Basic login successful"
    else
        print_status "ERROR" "Basic login failed: $LOGIN_RESPONSE"
    fi
    
    # Test invalid credentials
    INVALID_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/v1/auth/login/" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"invalid\",\"password\":\"invalid\"}")
    
    if echo "$INVALID_RESPONSE" | grep -q "Invalid credentials"; then
        print_status "SUCCESS" "Invalid credentials properly rejected"
    else
        print_status "ERROR" "Invalid credentials not properly handled: $INVALID_RESPONSE"
    fi
    
    # Clean up
    rm -f "$COOKIE_JAR"
}

# Test 2: Session validation endpoint
test_session_validation() {
    echo ""
    print_status "INFO" "=== Testing Session Validation Endpoint ==="
    
    # Test without authentication
    VALIDATION_RESPONSE=$(curl -s "$BACKEND_URL/api/v1/auth/validate-session/")
    if echo "$VALIDATION_RESPONSE" | grep -q '"valid":false'; then
        print_status "SUCCESS" "Session validation returns false for unauthenticated user"
    else
        print_status "ERROR" "Session validation not working for unauthenticated user: $VALIDATION_RESPONSE"
    fi
    
    # Test with authentication
    COOKIE_JAR=$(mktemp)
    curl -s -c "$COOKIE_JAR" -X POST "$BACKEND_URL/api/v1/auth/login/" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$ADMIN_USERNAME\",\"password\":\"$ADMIN_PASSWORD\"}" > /dev/null
    
    AUTH_VALIDATION_RESPONSE=$(curl -s -b "$COOKIE_JAR" "$BACKEND_URL/api/v1/auth/validate-session/")
    if echo "$AUTH_VALIDATION_RESPONSE" | grep -q '"valid":true'; then
        print_status "SUCCESS" "Session validation returns true for authenticated user"
    else
        print_status "ERROR" "Session validation not working for authenticated user: $AUTH_VALIDATION_RESPONSE"
    fi
    
    rm -f "$COOKIE_JAR"
}

# Test 3: API timeout handling
test_api_timeouts() {
    echo ""
    print_status "INFO" "=== Testing API Timeout Handling ==="
    
    # Test normal API response time
    START_TIME=$(date +%s%N)
    curl -s "$BACKEND_URL/api/v1/articles/published/?page=1&page_size=10" > /dev/null
    END_TIME=$(date +%s%N)
    DURATION=$(( (END_TIME - START_TIME) / 1000000 )) # Convert to milliseconds
    
    if [ $DURATION -lt 30000 ]; then
        print_status "SUCCESS" "API response time acceptable: ${DURATION}ms"
    else
        print_status "ERROR" "API response time too slow: ${DURATION}ms"
    fi
}

# Test 4: Authentication edge cases
test_auth_edge_cases() {
    echo ""
    print_status "INFO" "=== Testing Authentication Edge Cases ==="
    
    # Test empty credentials
    EMPTY_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/v1/auth/login/" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"\",\"password\":\"\"}")
    
    if echo "$EMPTY_RESPONSE" | grep -q "Username and password are required"; then
        print_status "SUCCESS" "Empty credentials properly rejected"
    else
        print_status "ERROR" "Empty credentials not properly handled: $EMPTY_RESPONSE"
    fi
    
    # Test malformed JSON
    MALFORMED_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/v1/auth/login/" \
        -H "Content-Type: application/json" \
        -d "invalid json")
    
    if echo "$MALFORMED_RESPONSE" | grep -q "Invalid JSON data"; then
        print_status "SUCCESS" "Malformed JSON properly rejected"
    else
        print_status "ERROR" "Malformed JSON not properly handled: $MALFORMED_RESPONSE"
    fi
    
    # Test non-staff user (if exists)
    NON_STAFF_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/v1/auth/login/" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"testuser\",\"password\":\"testpass\"}")
    
    if echo "$NON_STAFF_RESPONSE" | grep -q "Only admin users can access this system"; then
        print_status "SUCCESS" "Non-staff user properly rejected"
    else
        print_status "INFO" "Non-staff user test skipped (user may not exist)"
    fi
}

# Test 5: Session persistence
test_session_persistence() {
    echo ""
    print_status "INFO" "=== Testing Session Persistence ==="
    
    COOKIE_JAR=$(mktemp)
    
    # Login
    curl -s -c "$COOKIE_JAR" -X POST "$BACKEND_URL/api/v1/auth/login/" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$ADMIN_USERNAME\",\"password\":\"$ADMIN_PASSWORD\"}" > /dev/null
    
    # Wait a moment
    sleep 2
    
    # Test multiple requests with same session
    for i in {1..3}; do
        USER_RESPONSE=$(curl -s -b "$COOKIE_JAR" "$BACKEND_URL/api/v1/auth/user/")
        if echo "$USER_RESPONSE" | grep -q '"username"'; then
            print_status "SUCCESS" "Session persistence test $i - PASSED"
        else
            print_status "ERROR" "Session persistence test $i - FAILED"
        fi
        sleep 1
    done
    
    rm -f "$COOKIE_JAR"
}

# Test 6: Logout functionality
test_logout() {
    echo ""
    print_status "INFO" "=== Testing Logout Functionality ==="
    
    COOKIE_JAR=$(mktemp)
    
    # Login first
    curl -s -c "$COOKIE_JAR" -X POST "$BACKEND_URL/api/v1/auth/login/" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$ADMIN_USERNAME\",\"password\":\"$ADMIN_PASSWORD\"}" > /dev/null
    
    # Test logout
    LOGOUT_RESPONSE=$(curl -s -b "$COOKIE_JAR" -X POST "$BACKEND_URL/api/v1/auth/logout/")
    if echo "$LOGOUT_RESPONSE" | grep -q "Logout successful"; then
        print_status "SUCCESS" "Logout successful"
    else
        print_status "ERROR" "Logout failed: $LOGOUT_RESPONSE"
    fi
    
    # Test that session is invalidated
    USER_RESPONSE=$(curl -s -b "$COOKIE_JAR" "$BACKEND_URL/api/v1/auth/user/")
    if echo "$USER_RESPONSE" | grep -q "Authentication credentials were not provided"; then
        print_status "SUCCESS" "Session properly invalidated after logout"
    else
        print_status "ERROR" "Session not properly invalidated after logout: $USER_RESPONSE"
    fi
    
    rm -f "$COOKIE_JAR"
}

# Test 7: CSRF token handling
test_csrf_handling() {
    echo ""
    print_status "INFO" "=== Testing CSRF Token Handling ==="
    
    # Test CSRF token endpoint
    CSRF_RESPONSE=$(curl -s "$BACKEND_URL/api/v1/auth/csrf-token/")
    if echo "$CSRF_RESPONSE" | grep -q "csrf_token"; then
        print_status "SUCCESS" "CSRF token endpoint working"
    else
        print_status "ERROR" "CSRF token endpoint not working: $CSRF_RESPONSE"
    fi
}

# Test 8: Network error handling
test_network_errors() {
    echo ""
    print_status "INFO" "=== Testing Network Error Handling ==="
    
    # Test with invalid URL (should timeout)
    TIMEOUT_RESPONSE=$(curl -s --max-time 5 "http://invalid-url-that-does-not-exist.com/api/v1/auth/user/" 2>&1)
    if echo "$TIMEOUT_RESPONSE" | grep -q "timeout\|Connection refused\|Name or service not known"; then
        print_status "SUCCESS" "Network error handling working"
    else
        print_status "ERROR" "Network error handling not working: $TIMEOUT_RESPONSE"
    fi
}

# Main test execution
main() {
    echo "Starting comprehensive authentication tests..."
    echo ""
    
    # Check if services are running
    if ! check_backend; then
        exit 1
    fi
    
    if ! check_frontend; then
        exit 1
    fi
    
    # Run all tests
    test_basic_login
    test_session_validation
    test_api_timeouts
    test_auth_edge_cases
    test_session_persistence
    test_logout
    test_csrf_handling
    test_network_errors
    
    echo ""
    print_status "INFO" "=== Test Results Summary ==="
    print_status "INFO" "Total Tests: $TOTAL_TESTS"
    print_status "SUCCESS" "Passed: $TESTS_PASSED"
    print_status "ERROR" "Failed: $TESTS_FAILED"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        print_status "SUCCESS" "All tests passed! 🎉"
        exit 0
    else
        print_status "ERROR" "Some tests failed. Please review the errors above."
        exit 1
    fi
}

# Run main function
main "$@"
