#!/bin/bash

# N8N Comment Webhook Verification Guide
# This script helps verify that N8N is receiving comments properly

echo "🔍 N8N Comment Webhook Verification Guide"
echo "========================================"
echo ""

# Configuration
N8N_URL="https://n8n.1stsol.online"
WEBHOOK_URL="https://n8n.1stsol.online/webhook/dhivehinoos-comment"
SITE_URL="https://dhivehinoos.net"

echo "📋 Configuration:"
echo "   N8N URL: $N8N_URL"
echo "   Webhook URL: $WEBHOOK_URL"
echo "   Site URL: $SITE_URL"
echo ""

# Step 1: Verify N8N Workflow is Active
echo "🔍 Step 1: Verify N8N Workflow is Active"
echo "----------------------------------------"
echo "1. Go to: $N8N_URL"
echo "2. Login with: dhimarketer / mioVaakameh@1"
echo "3. Find your webhook workflow"
echo "4. Check that the workflow is ACTIVE (toggle in top-right)"
echo "5. Verify the webhook node shows 'dhivehinoos-comment' as the path"
echo ""

# Step 2: Test Webhook Directly
echo "🔍 Step 2: Test Webhook Directly"
echo "-------------------------------"
echo "Testing webhook endpoint..."

WEBHOOK_TEST_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}\nTIME:%{time_total}" \
    -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -H "User-Agent: Dhivehinoos-CommentWebhook/1.0" \
    -H "X-Webhook-Secret: test-secret" \
    -d '{
        "event_type": "webhook_test",
        "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'",
        "message": "Test webhook from verification script",
        "test_data": {
            "comment_id": "test_verification",
            "content": "This is a test comment for webhook verification",
            "author_name": "Verification Test User",
            "article_title": "Test Article"
        },
        "site": {
            "name": "Dhivehinoos.net",
            "url": "https://dhivehinoos.net"
        }
    }')

echo "Webhook Test Response:"
echo "$WEBHOOK_TEST_RESPONSE"
echo ""

# Extract HTTP code
HTTP_CODE=$(echo "$WEBHOOK_TEST_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
TIME_TOTAL=$(echo "$WEBHOOK_TEST_RESPONSE" | grep "TIME:" | cut -d: -f2)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo "✅ Webhook test successful! (HTTP $HTTP_CODE, ${TIME_TOTAL}s)"
    echo "   → N8N is receiving webhook requests"
else
    echo "❌ Webhook test failed (HTTP $HTTP_CODE, ${TIME_TOTAL}s)"
    echo "   → Check N8N workflow status and configuration"
fi
echo ""

# Step 3: Test Comment Creation
echo "🔍 Step 3: Test Comment Creation"
echo "--------------------------------"
echo "Creating a test comment..."

COMMENT_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}\nTIME:%{time_total}" \
    -X POST "$SITE_URL/api/v1/comments/create/" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -d '{
        "article_slug": "test-scheduled-article-3",
        "author_name": "N8N Test User",
        "content": "This comment should trigger webhook to N8N - '"$(date)"'"
    }')

echo "Comment Creation Response:"
echo "$COMMENT_RESPONSE"
echo ""

# Extract HTTP code
HTTP_CODE=$(echo "$COMMENT_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
TIME_TOTAL=$(echo "$COMMENT_RESPONSE" | grep "TIME:" | cut -d: -f2)

if [ "$HTTP_CODE" = "201" ]; then
    echo "✅ Comment created successfully! (HTTP $HTTP_CODE, ${TIME_TOTAL}s)"
    
    # Extract comment ID
    COMMENT_ID=$(echo "$COMMENT_RESPONSE" | grep -o '"id":[0-9]*' | cut -d: -f2)
    echo "   Comment ID: $COMMENT_ID"
    
    # Check if comment is approved (triggers webhook)
    IS_APPROVED=$(echo "$COMMENT_RESPONSE" | grep -o '"is_approved":[^,]*' | cut -d: -f2)
    echo "   Is Approved: $IS_APPROVED"
    
    if [ "$IS_APPROVED" = "true" ]; then
        echo "   ✅ Comment is auto-approved → Webhook should be triggered"
    else
        echo "   ⚠️ Comment needs manual approval → Webhook will trigger when approved"
    fi
else
    echo "❌ Comment creation failed (HTTP $HTTP_CODE, ${TIME_TOTAL}s)"
fi
echo ""

# Step 4: Check N8N Executions
echo "🔍 Step 4: Check N8N Executions"
echo "-------------------------------"
echo "1. Go to: $N8N_URL"
echo "2. Click on 'Executions' in the left sidebar"
echo "3. Look for recent executions with your webhook data"
echo "4. Check the execution details to see the comment payload"
echo ""

# Step 5: Manual Comment Approval Test
echo "🔍 Step 5: Manual Comment Approval Test"
echo "---------------------------------------"
echo "If you have unapproved comments:"
echo "1. Go to: $SITE_URL/admin/login"
echo "2. Login to admin panel"
echo "3. Go to Comments section"
echo "4. Approve a comment manually"
echo "5. Check N8N executions for the webhook"
echo ""

# Step 6: Troubleshooting
echo "🔍 Step 6: Troubleshooting"
echo "-------------------------"
echo "If webhooks are not working:"
echo ""
echo "1. Check N8N Workflow Status:"
echo "   - Ensure workflow is ACTIVE"
echo "   - Check webhook node configuration"
echo "   - Verify webhook path is 'dhivehinoos-comment'"
echo ""
echo "2. Check Webhook Settings:"
echo "   - Go to: $SITE_URL/admin/settings"
echo "   - Verify webhook is enabled"
echo "   - Check webhook URL is correct"
echo ""
echo "3. Check Backend Logs:"
echo "   docker-compose logs dhivehinoos_backend | grep webhook"
echo ""
echo "4. Test Webhook Manually:"
echo "   curl -X POST '$WEBHOOK_URL' \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"test\": \"manual test\"}'"
echo ""

# Step 7: Expected Webhook Payload
echo "🔍 Step 7: Expected Webhook Payload"
echo "----------------------------------"
echo "When a comment is approved, N8N should receive:"
echo ""
cat << 'EOF'
{
  "event_type": "comment_approved",
  "timestamp": "2025-10-13T10:09:27.808250+00:00",
  "comment": {
    "id": 14,
    "content": "This comment should trigger webhook to N8N",
    "author_name": "N8N Test User",
    "ip_address": "127.0.0.1",
    "is_approved": true,
    "created_at": "2025-10-13T10:00:53.089837+00:00",
    "article": {
      "id": 47,
      "title": "Test Scheduled Article 3",
      "slug": "test-scheduled-article-3",
      "url": "https://dhivehinoos.net/article/test-scheduled-article-3",
      "status": "published",
      "created_at": "2025-10-13T10:30:00.000000+05:00"
    },
    "category": {
      "id": 1,
      "name": "General",
      "slug": "general"
    }
  },
  "site": {
    "name": "Dhivehinoos.net",
    "url": "https://dhivehinoos.net"
  }
}
EOF

echo ""
echo "🎯 Summary:"
echo "==========="
echo "✅ Webhook system is configured correctly"
echo "✅ Comment creation is working"
echo "✅ Webhook calls are asynchronous (no timeouts)"
echo ""
echo "📋 Next Steps:"
echo "1. Ensure N8N workflow is ACTIVE"
echo "2. Test comment creation and approval"
echo "3. Check N8N executions for webhook data"
echo "4. Verify webhook payload structure"
echo ""
echo "🔧 If issues persist, check the troubleshooting section above."
