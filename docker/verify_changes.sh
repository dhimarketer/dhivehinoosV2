#!/bin/bash

# Verification script for Linode - checks if changes are in the container

echo "========================================="
echo "🔍 Verifying Frontend Changes"
echo "========================================="
echo ""

# 1. Check file timestamps (newer files = new build)
echo "1️⃣ Checking build file timestamps..."
docker exec dhivehinoos_frontend ls -lh /usr/local/apache2/htdocs/assets/HomePage*.js 2>/dev/null | head -1
echo ""

# 2. Check file sizes (different sizes = different build)
echo "2️⃣ Checking HomePage.js file size..."
docker exec dhivehinoos_frontend sh -c "ls -lh /usr/local/apache2/htdocs/assets/HomePage*.js" 2>/dev/null
echo ""

# 3. Check for specific patterns in minified code
echo "3️⃣ Checking for slice(1).slice(0 pattern (our fix)..."
SLICE_CHECK=$(docker exec dhivehinoos_frontend sh -c "grep -o 'slice(1).slice(0' /usr/local/apache2/htdocs/assets/*.js 2>/dev/null | head -1")
if [ -n "$SLICE_CHECK" ]; then
    echo "✅ Found slice(1).slice(0 pattern - fix is present!"
else
    echo "❌ slice(1).slice(0 pattern NOT found"
    # Check for old pattern
    OLD_SLICE=$(docker exec dhivehinoos_frontend sh -c "grep -o 'slice(1,.*pageSize' /usr/local/apache2/htdocs/assets/*.js 2>/dev/null | head -1")
    if [ -n "$OLD_SLICE" ]; then
        echo "⚠️  Found OLD slice pattern instead"
    fi
fi
echo ""

# 4. Check for allCategories (should be in minified code)
echo "4️⃣ Checking for allCategories pattern..."
ALLCAT_CHECK=$(docker exec dhivehinoos_frontend sh -c "grep -o 'allCategories' /usr/local/apache2/htdocs/assets/*.js 2>/dev/null | head -1")
if [ -n "$ALLCAT_CHECK" ]; then
    echo "✅ Found allCategories - navigation fix is present!"
else
    echo "❌ allCategories NOT found"
    # Check for old pattern
    OLD_CAT=$(docker exec dhivehinoos_frontend sh -c "grep -o 'topCategories' /usr/local/apache2/htdocs/assets/*.js 2>/dev/null | head -1")
    if [ -n "$OLD_CAT" ]; then
        echo "⚠️  Found OLD topCategories pattern instead"
    fi
fi
echo ""

# 5. Check for max-width 1400px
echo "5️⃣ Checking for max-w-[1400px] pattern..."
MAXW_CHECK=$(docker exec dhivehinoos_frontend sh -c "grep -o '1400px' /usr/local/apache2/htdocs/assets/*.js 2>/dev/null | head -1")
if [ -n "$MAXW_CHECK" ]; then
    echo "✅ Found 1400px - ad width fix is present!"
else
    echo "❌ 1400px NOT found"
    # Check for old pattern
    OLD_MAXW=$(docker exec dhivehinoos_frontend sh -c "grep -o '1000px' /usr/local/apache2/htdocs/assets/*.js 2>/dev/null | head -1")
    if [ -n "$OLD_MAXW" ]; then
        echo "⚠️  Found OLD 1000px pattern instead"
    fi
fi
echo ""

# 6. Check image creation time
echo "6️⃣ Checking image creation time..."
docker inspect dhimarketer/frontend:latest --format='Image created: {{.Created}}' 2>/dev/null
echo ""

# 7. Check container restart time
echo "7️⃣ Checking container start time..."
docker inspect dhivehinoos_frontend --format='Container started: {{.State.StartedAt}}' 2>/dev/null
echo ""

echo "========================================="
echo "📋 Summary:"
echo "========================================="
echo "If all checks show ✅, the changes are in the container."
echo "If you see ❌, the old code is still running."
echo ""
echo "💡 Next steps:"
echo "1. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)"
echo "2. Try incognito/private browsing mode"
echo "3. Check browser DevTools Network tab - ensure JS files are not cached"
echo ""



