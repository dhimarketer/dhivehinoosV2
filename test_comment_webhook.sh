#!/bin/bash

# Comment Webhook Test Script
# Tests the comment webhook functionality with N8N

echo "=== Comment Webhook Test Suite ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="http://localhost:8000"
WEBHOOK_URL="https://n8n.1stsol.online/webhook-test/dhivehinoos-comment"
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

# Test 1: Check webhook settings
test_webhook_settings() {
    echo ""
    print_status "INFO" "=== Testing Webhook Settings ==="
    
    # Check current webhook settings (using admin endpoint)
    local cookie_jar=$(get_admin_session)
    SETTINGS_RESPONSE=$(curl -s -b "$cookie_jar" "$BACKEND_URL/api/v1/settings/admin/get/")
    rm -f "$cookie_jar"
    
    if echo "$SETTINGS_RESPONSE" | grep -q "comment_webhook_enabled"; then
        print_status "SUCCESS" "Webhook settings endpoint accessible"
        
        # Check if webhook is enabled
        if echo "$SETTINGS_RESPONSE" | grep -q '"comment_webhook_enabled":true'; then
            print_status "SUCCESS" "Webhook is enabled in settings"
        else
            print_status "ERROR" "Webhook is not enabled in settings"
        fi
        
        # Check webhook URL
        if echo "$SETTINGS_RESPONSE" | grep -q "n8n.1stsol.online"; then
            print_status "SUCCESS" "N8N webhook URL is configured"
        else
            print_status "ERROR" "N8N webhook URL is not configured"
        fi
    else
        print_status "ERROR" "Webhook settings endpoint not accessible"
    fi
}

# Test 2: Test webhook endpoint
test_webhook_endpoint() {
    echo ""
    print_status "INFO" "=== Testing Webhook Endpoint ==="
    
    local cookie_jar=$(get_admin_session)
    
    # Test webhook endpoint
    WEBHOOK_RESPONSE=$(curl -s -b "$cookie_jar" -X POST "$BACKEND_URL/api/v1/comments/test-webhook/")
    
    if echo "$WEBHOOK_RESPONSE" | grep -q "success"; then
        print_status "SUCCESS" "Webhook test endpoint accessible"
        
        if echo "$WEBHOOK_RESPONSE" | grep -q '"success":true'; then
            print_status "SUCCESS" "Webhook test successful - N8N is responding"
        else
            print_status "ERROR" "Webhook test failed - N8N not responding properly"
            echo "Response: $WEBHOOK_RESPONSE"
        fi
    else
        print_status "ERROR" "Webhook test endpoint not accessible"
    fi
    
    rm -f "$cookie_jar"
}

# Test 3: Test webhook with direct request
test_direct_webhook() {
    echo ""
    print_status "INFO" "=== Testing Direct Webhook Request ==="
    
    # Test payload
    TEST_PAYLOAD='{
        "event_type": "webhook_test",
        "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'",
        "message": "This is a test webhook from Dhivehinoos.net",
        "test_data": {
            "comment_id": "test_123",
            "content": "This is a test comment for webhook testing",
            "author_name": "Test User",
            "article_title": "Test Article"
        },
        "site": {
            "name": "Dhivehinoos.net",
            "url": "https://dhivehinoos.net"
        }
    }'
    
    # Send direct request to N8N webhook
    DIRECT_RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -H "User-Agent: Dhivehinoos-CommentWebhook/1.0" \
        -d "$TEST_PAYLOAD" \
        -w "HTTPSTATUS:%{http_code}")
    
    HTTP_STATUS=$(echo "$DIRECT_RESPONSE" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    RESPONSE_BODY=$(echo "$DIRECT_RESPONSE" | sed 's/HTTPSTATUS:[0-9]*$//')
    
    if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "201" ] || [ "$HTTP_STATUS" = "202" ]; then
        print_status "SUCCESS" "Direct webhook request successful (HTTP $HTTP_STATUS)"
    else
        print_status "ERROR" "Direct webhook request failed (HTTP $HTTP_STATUS)"
        echo "Response: $RESPONSE_BODY"
    fi
}

# Test 4: Test comment creation and approval flow
test_comment_approval_flow() {
    echo ""
    print_status "INFO" "=== Testing Comment Approval Flow ==="
    
    local cookie_jar=$(get_admin_session)
    
    # First, get an article to comment on
    ARTICLES_RESPONSE=$(curl -s "$BACKEND_URL/api/v1/articles/published/?page=1&page_size=1")
    
    if echo "$ARTICLES_RESPONSE" | grep -q '"id"'; then
        ARTICLE_ID=$(echo "$ARTICLES_RESPONSE" | jq -r '.results[0].id')
        ARTICLE_SLUG=$(echo "$ARTICLES_RESPONSE" | jq -r '.results[0].slug')
        
        print_status "SUCCESS" "Found article for testing: $ARTICLE_SLUG"
        
        # Create a test comment
        COMMENT_PAYLOAD='{
            "article_slug": "'$ARTICLE_SLUG'",
            "author_name": "Webhook Test User",
            "content": "This is a test comment for webhook testing. Please approve this comment to test the webhook functionality."
        }'
        
        COMMENT_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/v1/comments/create/" \
            -H "Content-Type: application/json" \
            -d "$COMMENT_PAYLOAD")
        
        if echo "$COMMENT_RESPONSE" | grep -q '"id"'; then
            COMMENT_ID=$(echo "$COMMENT_RESPONSE" | jq -r '.id')
            print_status "SUCCESS" "Test comment created with ID: $COMMENT_ID"
            
            # Approve the comment (this should trigger webhook)
            APPROVE_RESPONSE=$(curl -s -b "$cookie_jar" -X POST "$BACKEND_URL/api/v1/comments/admin/$COMMENT_ID/approve/")
            
            if echo "$APPROVE_RESPONSE" | grep -q "Comment approved successfully"; then
                print_status "SUCCESS" "Comment approved successfully - webhook should have been triggered"
            else
                print_status "ERROR" "Failed to approve comment"
                echo "Response: $APPROVE_RESPONSE"
            fi
        else
            print_status "ERROR" "Failed to create test comment"
            echo "Response: $COMMENT_RESPONSE"
        fi
    else
        print_status "ERROR" "No articles found for testing"
    fi
    
    rm -f "$cookie_jar"
}

# Test 5: Check webhook logs
check_webhook_logs() {
    echo ""
    print_status "INFO" "=== Checking Webhook Logs ==="
    
    # Check Django logs for webhook activity
    if [ -f "/home/mine/Documents/codingProjects/dhivehinoosV2/backend/logs/django.log" ]; then
        WEBHOOK_LOGS=$(grep -i "webhook" /home/mine/Documents/codingProjects/dhivehinoosV2/backend/logs/django.log | tail -5)
        if [ -n "$WEBHOOK_LOGS" ]; then
            print_status "SUCCESS" "Found webhook activity in logs"
            echo "Recent webhook logs:"
            echo "$WEBHOOK_LOGS"
        else
            print_status "INFO" "No recent webhook activity in logs"
        fi
    else
        print_status "INFO" "No Django log file found"
    fi
}

# Main test execution
main() {
    echo "Starting comment webhook tests..."
    echo ""
    print_status "INFO" "Webhook URL: $WEBHOOK_URL"
    print_status "INFO" "Backend URL: $BACKEND_URL"
    echo ""
    
    # Check if backend is running
    if ! curl -s -f "$BACKEND_URL/api/v1/articles/health/" > /dev/null 2>&1; then
        print_status "ERROR" "Backend is not running. Please start the backend first."
        exit 1
    fi
    
    # Run all tests
    test_webhook_settings
    test_webhook_endpoint
    test_direct_webhook
    test_comment_approval_flow
    check_webhook_logs
    
    echo ""
    print_status "INFO" "=== Test Results Summary ==="
    print_status "INFO" "Total Tests: $TOTAL_TESTS"
    print_status "SUCCESS" "Passed: $TESTS_PASSED"
    print_status "ERROR" "Failed: $TESTS_FAILED"
    
    echo ""
    print_status "INFO" "=== Next Steps ==="
    print_status "INFO" "1. Make sure your N8N workflow is running and the webhook is registered"
    print_status "INFO" "2. Click 'Execute workflow' in N8N to activate the webhook"
    print_status "INFO" "3. Run this test again to verify webhook functionality"
    print_status "INFO" "4. Test with real comment approval to ensure webhooks are sent"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        print_status "SUCCESS" "All tests passed! Webhook system is working correctly. 🎉"
        exit 0
    else
        print_status "ERROR" "Some tests failed. Please check the N8N workflow configuration."
        exit 1
    fi
}

# Run main function
main "$@"
