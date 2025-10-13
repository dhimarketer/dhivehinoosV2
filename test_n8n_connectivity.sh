#!/bin/bash

# Test script to find the correct N8N webhook URL
# Run this on your Linode server

echo "🔍 Testing N8N webhook connectivity..."

# Test different possible URLs
URLS=(
    "http://localhost:5678/webhook-test/dhivehinoos-comment"
    "http://127.0.0.1:5678/webhook-test/dhivehinoos-comment"
    "http://host.docker.internal:5678/webhook-test/dhivehinoos-comment"
    "http://172.17.0.1:5678/webhook-test/dhivehinoos-comment"
)

for url in "${URLS[@]}"; do
    echo "Testing: $url"
    response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$url" \
        -H "Content-Type: application/json" \
        -d '{"test": "webhook connectivity test"}' \
        --connect-timeout 5)
    
    if [ "$response" = "404" ]; then
        echo "✅ N8N is reachable at $url (404 = webhook not registered, but service is up)"
        echo "   → This is the URL you should use in your webhook settings!"
        break
    elif [ "$response" = "200" ] || [ "$response" = "201" ]; then
        echo "✅ N8N webhook is working at $url"
        break
    else
        echo "❌ Not reachable (HTTP $response)"
    fi
done

echo ""
echo "📋 Next steps:"
echo "1. Use the working URL in your webhook settings"
echo "2. Execute your N8N workflow to register the webhook"
echo "3. Test the webhook from your admin panel"
