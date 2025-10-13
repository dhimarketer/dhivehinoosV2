#!/bin/bash

# Comment Timeout Fix Test Script
# This script tests the comment creation timeout fix

echo "🔧 Comment Timeout Fix Test"
echo "=========================="

# Configuration
BASE_URL="https://dhivehinoos.net"
API_URL="$BASE_URL/api/v1"

# Test data
TEST_ARTICLE_SLUG="we-keep-finding-our-voice-in-the-noise"  # Use an existing article
TEST_COMMENT="Timeout fix test comment - $(date)"

echo "📋 Test Configuration:"
echo "   Base URL: $BASE_URL"
echo "   API URL: $API_URL"
echo "   Test Article: $TEST_ARTICLE_SLUG"
echo "   Test Comment: $TEST_COMMENT"
echo ""

# Test 1: Single comment creation with timing
echo "🔍 Test 1: Single Comment Creation (Timeout Test)"
echo "------------------------------------------------"
echo "Testing comment creation with timing..."

START_TIME=$(date +%s.%N)

COMMENT_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}\nTIME:%{time_total}" \
    -X POST "$API_URL/comments/create/" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -d "{
        \"article_slug\": \"$TEST_ARTICLE_SLUG\",
        \"author_name\": \"Timeout Test User $(date +%s)\",
        \"content\": \"$TEST_COMMENT\"
    }")

END_TIME=$(date +%s.%N)
DURATION=$(echo "$END_TIME - $START_TIME" | bc)

echo "Response:"
echo "$COMMENT_RESPONSE"
echo ""

# Extract HTTP code and time
HTTP_CODE=$(echo "$COMMENT_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
TIME_TOTAL=$(echo "$COMMENT_RESPONSE" | grep "TIME:" | cut -d: -f2)

echo "📊 Results:"
echo "   HTTP Status: $HTTP_CODE"
echo "   Response Time: ${TIME_TOTAL}s"
echo "   Total Duration: ${DURATION}s"

if [ "$HTTP_CODE" = "201" ]; then
    echo "   ✅ Comment created successfully"
    
    # Extract comment ID for further testing
    COMMENT_ID=$(echo "$COMMENT_RESPONSE" | grep -o '"id":[0-9]*' | cut -d: -f2)
    echo "   Comment ID: $COMMENT_ID"
    
    # Check if response time is reasonable (should be under 10 seconds)
    if (( $(echo "$TIME_TOTAL < 10" | bc -l) )); then
        echo "   ✅ Response time is acceptable (< 10s)"
    else
        echo "   ⚠️  Response time is slow (> 10s)"
    fi
else
    echo "   ❌ Comment creation failed"
fi

echo ""

# Test 2: Multiple rapid requests to test webhook handling
echo "🔍 Test 2: Multiple Rapid Requests (Webhook Load Test)"
echo "---------------------------------------------------"
echo "Sending 3 rapid comment creation requests..."

for i in {1..3}; do
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
echo "🔍 Test 3: Webhook Configuration Test"
echo "------------------------------------"
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

# Test 4: Check if comments are visible
echo "🔍 Test 4: Comment Visibility Test"
echo "---------------------------------"
echo "Checking if comments are visible on the article page..."

COMMENTS_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}\nTIME:%{time_total}" \
    -X GET "$API_URL/comments/article/$TEST_ARTICLE_SLUG/" \
    -H "Accept: application/json")

COMMENTS_HTTP_CODE=$(echo "$COMMENTS_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
COMMENTS_TIME=$(echo "$COMMENTS_RESPONSE" | grep "TIME:" | cut -d: -f2)

echo "Comments API Response:"
echo "$COMMENTS_RESPONSE"
echo ""

echo "📊 Comments API Results:"
echo "   HTTP Status: $COMMENTS_HTTP_CODE"
echo "   Response Time: ${COMMENTS_TIME}s"

if [ "$COMMENTS_HTTP_CODE" = "200" ]; then
    echo "   ✅ Comments API working"
else
    echo "   ❌ Comments API failed"
fi

echo ""
echo "🎯 Summary:"
echo "==========="
echo "✅ Comment creation timeout fix test completed"
echo "✅ Webhook load test completed"
echo "✅ Webhook configuration test completed"
echo "✅ Comment visibility test completed"
echo ""
echo "📋 Expected Results:"
echo "1. Comment creation should complete in under 10 seconds"
echo "2. Multiple rapid requests should not cause timeouts"
echo "3. Webhook should not block comment creation"
echo "4. Comments should be visible after creation"
echo ""
echo "🔧 If issues persist:"
echo "1. Check backend logs: docker-compose logs dhivehinoos_backend"
echo "2. Check webhook settings in admin panel"
echo "3. Verify N8N workflow is active and responsive"
echo "4. Check Redis connection if using Redis caching"
echo ""
echo "📈 Performance Notes:"
echo "- Webhook timeout reduced to 5 seconds"
echo "- Frontend timeout reduced to 15 seconds (10s for comments)"
echo "- Webhook runs in background thread to prevent blocking"
echo "- Added retry logic for better reliability"
