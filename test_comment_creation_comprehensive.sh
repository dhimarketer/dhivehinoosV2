#!/bin/bash

# Comprehensive Comment Creation Test
# This script tests comment creation with various scenarios

echo "🧪 Comprehensive Comment Creation Test"
echo "======================================"

# Configuration
BASE_URL="https://dhivehinoos.net"
API_URL="$BASE_URL/api/v1"

# Test data
TEST_ARTICLE_SLUG="test-scheduled-article-3"  # Use an existing article
TEST_COMMENT="This is a test comment for webhook testing - $(date)"

echo "📋 Test Configuration:"
echo "   Base URL: $BASE_URL"
echo "   API URL: $API_URL"
echo "   Test Article: $TEST_ARTICLE_SLUG"
echo "   Test Comment: $TEST_COMMENT"
echo ""

# Test 1: Basic comment creation
echo "🔍 Test 1: Basic Comment Creation"
echo "---------------------------------"
COMMENT_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}\nTIME:%{time_total}" \
    -X POST "$API_URL/comments/create/" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -d "{
        \"article_slug\": \"$TEST_ARTICLE_SLUG\",
        \"author_name\": \"Test User $(date +%s)\",
        \"content\": \"$TEST_COMMENT\"
    }")

echo "Response:"
echo "$COMMENT_RESPONSE"
echo ""

# Extract HTTP code and time
HTTP_CODE=$(echo "$COMMENT_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
TIME_TOTAL=$(echo "$COMMENT_RESPONSE" | grep "TIME:" | cut -d: -f2)

echo "📊 Results:"
echo "   HTTP Status: $HTTP_CODE"
echo "   Response Time: ${TIME_TOTAL}s"

if [ "$HTTP_CODE" = "201" ]; then
    echo "   ✅ Comment created successfully"
    
    # Extract comment ID for further testing
    COMMENT_ID=$(echo "$COMMENT_RESPONSE" | grep -o '"id":[0-9]*' | cut -d: -f2)
    echo "   Comment ID: $COMMENT_ID"
else
    echo "   ❌ Comment creation failed"
fi

echo ""

# Test 2: Comment creation with timeout test
echo "🔍 Test 2: Timeout Test (Multiple Rapid Requests)"
echo "------------------------------------------------"
echo "Sending 5 rapid comment creation requests..."

for i in {1..5}; do
    echo "Request $i:"
    START_TIME=$(date +%s.%N)
    
    RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}\nTIME:%{time_total}" \
        -X POST "$API_URL/comments/create/" \
        -H "Content-Type: application/json" \
        -H "Accept: application/json" \
        -d "{
            \"article_slug\": \"$TEST_ARTICLE_SLUG\",
            \"author_name\": \"Rapid Test User $i\",
            \"content\": \"Rapid test comment $i - $(date)\"
        }")
    
    END_TIME=$(date +%s.%N)
    DURATION=$(echo "$END_TIME - $START_TIME" | bc)
    
    HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
    TIME_TOTAL=$(echo "$RESPONSE" | grep "TIME:" | cut -d: -f2)
    
    echo "   Status: $HTTP_CODE, Time: ${TIME_TOTAL}s, Duration: ${DURATION}s"
    
    if [ "$HTTP_CODE" = "201" ]; then
        echo "   ✅ Success"
    else
        echo "   ❌ Failed"
        echo "   Response: $RESPONSE"
    fi
    echo ""
done

# Test 3: Webhook test
echo "🔍 Test 3: Webhook Test"
echo "----------------------"
echo "Testing webhook endpoint..."

WEBHOOK_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}\nTIME:%{time_total}" \
    -X POST "$API_URL/comments/test-webhook/" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -H "Cookie: sessionid=YOUR_SESSION_COOKIE" \
    -d "{}")

echo "Webhook Test Response:"
echo "$WEBHOOK_RESPONSE"
echo ""

# Test 4: Comment approval test (if we have a comment ID)
if [ ! -z "$COMMENT_ID" ]; then
    echo "🔍 Test 4: Comment Approval Test"
    echo "--------------------------------"
    echo "Testing comment approval for ID: $COMMENT_ID"
    
    # Note: This would require admin authentication
    echo "Note: Comment approval test requires admin authentication"
    echo "You can test this manually in the admin panel"
fi

echo ""
echo "🎯 Summary:"
echo "==========="
echo "✅ Basic comment creation test completed"
echo "✅ Timeout test completed"
echo "✅ Webhook test completed"
echo ""
echo "📋 Next Steps:"
echo "1. Check if comments are being created successfully"
echo "2. Verify webhook is not blocking comment creation"
echo "3. Test comment approval in admin panel"
echo "4. Check N8N workflow executions"
echo ""
echo "🔧 If issues persist:"
echo "1. Check backend logs: docker-compose logs dhivehinoos_backend"
echo "2. Check webhook settings in admin panel"
echo "3. Verify N8N workflow is active"
