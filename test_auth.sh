#!/bin/bash

echo "=== Testing Production Authentication ==="

# Test 1: Check if backend is responding
echo "1. Testing backend health..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:8052/api/v1/articles/published/
echo " - Backend health check"

# Test 2: Test login endpoint directly
echo "2. Testing login endpoint..."
curl -X POST http://localhost:8052/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}' \
  -v

echo ""
echo "3. Testing with CSRF token..."
# Get CSRF token first
CSRF_TOKEN=$(curl -s -c cookies.txt http://localhost:8052/api/v1/auth/login/ | grep csrftoken | cut -f7)
echo "CSRF Token: $CSRF_TOKEN"

curl -X POST http://localhost:8052/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -H "X-CSRFToken: $CSRF_TOKEN" \
  -b cookies.txt \
  -d '{"username": "admin", "password": "admin123"}' \
  -v

echo ""
echo "=== Test Complete ==="
