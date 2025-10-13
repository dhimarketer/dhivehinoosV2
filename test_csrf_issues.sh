#!/bin/bash

# CSRF Error Investigation Script
# Tests all admin endpoints for CSRF issues

echo "=== CSRF Error Investigation ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="http://localhost:8000"
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

# Function to get admin session cookie
get_admin_session() {
    local cookie_jar=$(mktemp)
    curl -s -c "$cookie_jar" -X POST "$BACKEND_URL/api/v1/auth/login/" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$ADMIN_USERNAME\",\"password\":\"$ADMIN_PASSWORD\"}" > /dev/null
    echo "$cookie_jar"
}

# Test 1: Login endpoint (should work without CSRF)
test_login_csrf() {
    echo ""
    print_status "INFO" "=== Testing Login CSRF ==="
    
    LOGIN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/v1/auth/login/" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$ADMIN_USERNAME\",\"password\":\"$ADMIN_PASSWORD\"}")
    
    if echo "$LOGIN_RESPONSE" | grep -q "Login successful"; then
        print_status "SUCCESS" "Login works without CSRF token"
    else
        print_status "ERROR" "Login failed: $LOGIN_RESPONSE"
    fi
}

# Test 2: Logout endpoint (should work without CSRF)
test_logout_csrf() {
    echo ""
    print_status "INFO" "=== Testing Logout CSRF ==="
    
    local cookie_jar=$(get_admin_session)
    
    LOGOUT_RESPONSE=$(curl -s -b "$cookie_jar" -X POST "$BACKEND_URL/api/v1/auth/logout/")
    
    if echo "$LOGOUT_RESPONSE" | grep -q "Logout successful"; then
        print_status "SUCCESS" "Logout works without CSRF token"
    else
        print_status "ERROR" "Logout failed: $LOGOUT_RESPONSE"
    fi
    
    rm -f "$cookie_jar"
}

# Test 3: Article admin endpoints (should work without CSRF)
test_article_admin_csrf() {
    echo ""
    print_status "INFO" "=== Testing Article Admin CSRF ==="
    
    local cookie_jar=$(get_admin_session)
    
    # Test GET (should work)
    GET_RESPONSE=$(curl -s -b "$cookie_jar" "$BACKEND_URL/api/v1/articles/admin/")
    if echo "$GET_RESPONSE" | grep -q '"count"'; then
        print_status "SUCCESS" "Article admin GET works without CSRF"
    else
        print_status "ERROR" "Article admin GET failed: $GET_RESPONSE"
    fi
    
    # Test PATCH (should work without CSRF)
    PATCH_RESPONSE=$(curl -s -b "$cookie_jar" -X PATCH "$BACKEND_URL/api/v1/articles/admin/48/" \
        -H "Content-Type: application/json" \
        -d '{"title": "Updated Title"}')
    
    if echo "$PATCH_RESPONSE" | grep -q '"id":48'; then
        print_status "SUCCESS" "Article admin PATCH works without CSRF"
    else
        print_status "ERROR" "Article admin PATCH failed: $PATCH_RESPONSE"
    fi
    
    rm -f "$cookie_jar"
}

# Test 4: Settings admin endpoints (should work without CSRF)
test_settings_admin_csrf() {
    echo ""
    print_status "INFO" "=== Testing Settings Admin CSRF ==="
    
    local cookie_jar=$(get_admin_session)
    
    # Test GET settings
    GET_RESPONSE=$(curl -s -b "$cookie_jar" "$BACKEND_URL/api/v1/settings/admin/get/")
    if echo "$GET_RESPONSE" | grep -q '"site_name"'; then
        print_status "SUCCESS" "Settings admin GET works without CSRF"
    else
        print_status "ERROR" "Settings admin GET failed: $GET_RESPONSE"
    fi
    
    # Test PUT settings
    PUT_RESPONSE=$(curl -s -b "$cookie_jar" -X PUT "$BACKEND_URL/api/v1/settings/admin/" \
        -H "Content-Type: application/json" \
        -d '{"site_name": "Test Site"}')
    
    if echo "$PUT_RESPONSE" | grep -q '"site_name"'; then
        print_status "SUCCESS" "Settings admin PUT works without CSRF"
    else
        print_status "ERROR" "Settings admin PUT failed: $PUT_RESPONSE"
    fi
    
    rm -f "$cookie_jar"
}

# Test 5: Comment admin endpoints (should work without CSRF)
test_comment_admin_csrf() {
    echo ""
    print_status "INFO" "=== Testing Comment Admin CSRF ==="
    
    local cookie_jar=$(get_admin_session)
    
    # Test GET comments
    GET_RESPONSE=$(curl -s -b "$cookie_jar" "$BACKEND_URL/api/v1/comments/admin/")
    if echo "$GET_RESPONSE" | grep -q '"count"'; then
        print_status "SUCCESS" "Comment admin GET works without CSRF"
    else
        print_status "ERROR" "Comment admin GET failed: $GET_RESPONSE"
    fi
    
    rm -f "$cookie_jar"
}

# Test 6: Test CSRF token endpoint
test_csrf_token_endpoint() {
    echo ""
    print_status "INFO" "=== Testing CSRF Token Endpoint ==="
    
    CSRF_RESPONSE=$(curl -s "$BACKEND_URL/api/v1/auth/csrf-token/")
    if echo "$CSRF_RESPONSE" | grep -q "csrf_token"; then
        print_status "SUCCESS" "CSRF token endpoint works"
    else
        print_status "ERROR" "CSRF token endpoint failed: $CSRF_RESPONSE"
    fi
}

# Test 7: Test with CSRF token (should work)
test_with_csrf_token() {
    echo ""
    print_status "INFO" "=== Testing With CSRF Token ==="
    
    # Get CSRF token
    CSRF_RESPONSE=$(curl -s "$BACKEND_URL/api/v1/auth/csrf-token/")
    CSRF_TOKEN=$(echo "$CSRF_RESPONSE" | jq -r '.csrf_token')
    
    if [ "$CSRF_TOKEN" != "null" ] && [ -n "$CSRF_TOKEN" ]; then
        print_status "SUCCESS" "CSRF token retrieved: $CSRF_TOKEN"
        
        # Test login with CSRF token
        LOGIN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/v1/auth/login/" \
            -H "Content-Type: application/json" \
            -H "X-CSRFToken: $CSRF_TOKEN" \
            -d "{\"username\":\"$ADMIN_USERNAME\",\"password\":\"$ADMIN_PASSWORD\"}")
        
        if echo "$LOGIN_RESPONSE" | grep -q "Login successful"; then
            print_status "SUCCESS" "Login works with CSRF token"
        else
            print_status "ERROR" "Login failed with CSRF token: $LOGIN_RESPONSE"
        fi
    else
        print_status "ERROR" "Failed to get CSRF token: $CSRF_RESPONSE"
    fi
}

# Main test execution
main() {
    echo "Starting CSRF error investigation..."
    echo ""
    
    # Check if backend is running
    if ! curl -s -f "$BACKEND_URL/api/v1/articles/health/" > /dev/null 2>&1; then
        print_status "ERROR" "Backend is not running. Please start the backend first."
        exit 1
    fi
    
    # Run all tests
    test_login_csrf
    test_logout_csrf
    test_article_admin_csrf
    test_settings_admin_csrf
    test_comment_admin_csrf
    test_csrf_token_endpoint
    test_with_csrf_token
    
    echo ""
    print_status "INFO" "=== Test Results Summary ==="
    print_status "INFO" "Total Tests: $TOTAL_TESTS"
    print_status "SUCCESS" "Passed: $TESTS_PASSED"
    print_status "ERROR" "Failed: $TESTS_FAILED"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        print_status "SUCCESS" "All CSRF tests passed! 🎉"
        exit 0
    else
        print_status "ERROR" "Some CSRF tests failed. Check the errors above."
        exit 1
    fi
}

# Run main function
main "$@"
