# Webhook Test Fix - Deployed! 🚀

## 🔧 **Problem Fixed**

The webhook test was failing with "Comment webhook disabled" even when it was enabled because:

1. **Authentication Issue**: The webhook test endpoint didn't require proper authentication
2. **CSRF Token Missing**: Frontend wasn't sending CSRF tokens for the test request
3. **Permission Check Missing**: No staff user validation for webhook testing

## ✅ **Changes Made**

### **Backend Fixes** (`backend/comments/views.py`)
- ✅ Added `@permission_classes([permissions.IsAuthenticated])` to webhook test endpoint
- ✅ Added staff user check: `if not request.user.is_staff:`
- ✅ Proper error responses for authentication failures

### **Frontend Fixes** (`frontend/src/pages/admin/SettingsPage.jsx`)
- ✅ Added CSRF token fetching before webhook test
- ✅ Proper authentication headers in test request
- ✅ Better error handling and user feedback

## 🚀 **Deploy the Fix**

Run this command on your Linode server:

```bash
# Navigate to your project directory on Linode
cd /opt/dhivehinoos

# Run the deployment script
sudo ./deploy_linode.sh
```

## 🧪 **Test the Webhook**

After deployment:

1. **Log in to admin panel**:
   - Go to `https://dhivehinoos.net/admin/login`
   - Enter your admin credentials

2. **Configure webhook settings**:
   - Go to Settings → Webhook Settings
   - Enable "Enable Comment Webhook"
   - Set your n8n webhook URL: `https://your-n8n-instance.com/webhook/dhivehinoos-comment`
   - Optionally set a webhook secret
   - Click "Save Settings"

3. **Test the webhook**:
   - Click "Test Webhook" button
   - You should see "Webhook test successful" message
   - If it fails, check the error message for specific issues

## 🔍 **Troubleshooting**

### **If webhook test still fails:**

1. **Check authentication**:
   ```bash
   # Test if you're properly logged in
   curl -X POST https://dhivehinoos.net/api/v1/comments/test-webhook/ \
     -H "Content-Type: application/json" \
     -H "Cookie: sessionid=YOUR_SESSION_ID" \
     -v
   ```

2. **Check webhook URL**:
   - Make sure the URL is accessible
   - Test with a simple webhook service like webhook.site
   - Verify the URL starts with `http://` or `https://`

3. **Check logs**:
   ```bash
   # View backend logs
   docker-compose logs dhivehinoos_backend
   
   # View specific webhook logs
   docker-compose logs dhivehinoos_backend | grep webhook
   ```

### **Common Issues:**

- **"Only admin users can test webhook settings"**: You're not logged in as admin
- **"Comment webhook is disabled"**: Webhook is not enabled in settings
- **"Comment webhook URL is not configured"**: URL field is empty
- **"Webhook connection error"**: The webhook URL is not accessible

## 📊 **Expected Behavior**

After the fix:

1. ✅ **Authentication Required**: Only logged-in admin users can test webhooks
2. ✅ **Proper Error Messages**: Clear feedback about what's wrong
3. ✅ **CSRF Protection**: Secure webhook testing
4. ✅ **Real Webhook Testing**: Actually sends test payload to your n8n instance

## 🎯 **Next Steps**

1. **Deploy the fix** using the deployment script
2. **Test the webhook** with your n8n instance
3. **Set up your n8n workflow** using the provided files:
   - `n8n-webhook-node.js` - Custom node
   - `n8n-workflow-example.json` - Example workflow
   - `N8N_WEBHOOK_INTEGRATION.md` - Complete guide

The webhook will now properly send approved comments to your n8n instance! 🎉

