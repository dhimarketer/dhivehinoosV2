# Webhook Settings Authentication Fix

## Problem
You're getting a 400 Bad Request error when trying to save webhook settings because the API endpoint now requires authentication.

## Solution

The settings API endpoint has been updated to require authentication. You need to:

### 1. **Log in to the admin panel**
- Go to `/admin/login` 
- Enter your admin credentials
- Make sure you're logged in successfully

### 2. **Check Authentication Status**
Open your browser's developer console and run:
```javascript
// Check if you're authenticated
fetch('/api/v1/auth/user/', {
  credentials: 'include'
})
.then(response => response.json())
.then(data => console.log('Auth status:', data))
.catch(error => console.log('Not authenticated:', error));
```

### 3. **Test the Webhook Settings**
After logging in, try saving the webhook settings again.

## What Changed

The backend now properly validates:
- ✅ User must be authenticated (logged in)
- ✅ User must be a staff member (admin)
- ✅ CSRF token validation
- ✅ Proper error responses

## If You Still Get Errors

### Check Browser Console
Look for any authentication errors in the browser console.

### Clear Browser Data
Sometimes stale authentication data can cause issues:
1. Clear cookies for your site
2. Clear localStorage
3. Log in again

### Manual Test
You can test the API directly with curl (replace with your session cookie):
```bash
# First, get your session cookie from browser dev tools
curl -X PUT https://dhivehinoos.net/api/v1/settings/admin/ \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionid=YOUR_SESSION_ID" \
  -d '{"comment_webhook_enabled": true, "comment_webhook_url": "https://your-n8n-instance.com/webhook/dhivehinoos-comment", "comment_webhook_secret": "your-secret"}'
```

## Expected Behavior

After logging in, you should be able to:
1. ✅ Access the settings page
2. ✅ Enable/disable webhook
3. ✅ Set webhook URL
4. ✅ Set webhook secret
5. ✅ Save settings successfully

The webhook will then send data to your n8n instance when comments are approved.
