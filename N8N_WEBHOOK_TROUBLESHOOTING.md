# N8N Webhook Troubleshooting Guide

## 🔍 **Issue: Webhook Receives Data But Workflow Doesn't Process It**

### ✅ **Current Status**
- Webhook URL: `https://n8n.1stsol.online/webhook/dhivehinoos-comment`
- Response: `{"message":"Workflow was started"}` ✅
- HTTP Status: 200 ✅
- Workflow: Active ✅

### 🚨 **Common Issues & Solutions**

#### **1. Check N8N Executions Tab**
- Go to: `https://n8n.1stsol.online`
- Click **"Executions"** in the left sidebar
- Look for recent executions (should show the webhook data)
- If you see executions but no data, the workflow has an error

#### **2. Check Workflow Canvas**
- Open your webhook workflow
- Look for **error indicators** (red dots, error messages)
- Check if nodes after the webhook are properly connected
- Verify all nodes are configured correctly

#### **3. Test Webhook Data Structure**
The webhook is sending this data structure:
```json
{
  "event_type": "comment_approved",
  "timestamp": "2025-10-13T15:10:26.380280+05:00",
  "comment": {
    "id": 14,
    "content": "This comment should trigger webhook to N8N",
    "author_name": "N8N Verification Test",
    "ip_address": "127.0.0.1",
    "is_approved": true,
    "created_at": "2025-10-13T15:10:26.380280+05:00",
    "article": {
      "id": 1054,
      "title": "We keep finding our voice in the noise",
      "slug": "we-keep-finding-our-voice-in-the-noise",
      "url": "https://dhivehinoos.net/article/we-keep-finding-our-voice-in-the-noise",
      "status": "published"
    }
  },
  "site": {
    "name": "Dhivehinoos.net",
    "url": "https://dhivehinoos.net"
  }
}
```

#### **4. Debug Steps**

**Step A: Check Executions**
1. Go to N8N → Executions
2. Look for recent executions
3. Click on an execution to see details
4. Check if there are any error messages

**Step B: Test Workflow Manually**
1. Open your workflow
2. Click **"Execute Workflow"** button
3. This will run the workflow with sample data
4. Check if it processes correctly

**Step C: Check Node Configuration**
1. Click on the webhook node
2. Verify the path is exactly: `dhivehinoos-comment`
3. Check if HTTP method is POST
4. Look for any error indicators

**Step D: Check Subsequent Nodes**
1. Look at nodes after the webhook
2. Check if they're properly connected
3. Verify their configuration
4. Look for error indicators

#### **5. Common Fixes**

**Fix 1: Re-execute Workflow**
- Sometimes N8N needs a fresh execution
- Click "Execute Workflow" to restart

**Fix 2: Check Data Path**
- In subsequent nodes, use `{{ $json.comment.content }}` to access comment data
- Use `{{ $json.comment.author_name }}` for author name
- Use `{{ $json.comment.article.title }}` for article title

**Fix 3: Add Debug Node**
- Add a "Set" node after webhook
- Set it to output the entire webhook data
- This helps you see what data is being received

**Fix 4: Check Workflow Status**
- Ensure workflow is ACTIVE (not just saved)
- Toggle it off and on again

#### **6. Test Commands**

**Test Webhook Directly:**
```bash
curl -X POST "https://n8n.1stsol.online/webhook/dhivehinoos-comment" \
  -H "Content-Type: application/json" \
  -d '{"test": "manual test"}'
```

**Test Comment Creation:**
```bash
curl -X POST "https://dhivehinoos.net/api/v1/comments/create/" \
  -H "Content-Type: application/json" \
  -d '{
    "article_slug": "we-keep-finding-our-voice-in-the-noise",
    "author_name": "Test User",
    "content": "Test comment for N8N"
  }'
```

#### **7. Expected Behavior**

When working correctly:
1. Comment is created on website
2. Webhook sends data to N8N
3. N8N workflow processes the data
4. You see execution in N8N executions tab
5. Subsequent nodes process the comment data

#### **8. Debug Workflow Example**

Here's a simple debug workflow you can create:
1. **Webhook Node** (already exists)
2. **Set Node** - to capture and display data
3. **Function Node** - to log the data
4. **Email/Slack Node** - to notify you

**Set Node Configuration:**
- Set `comment_id` to `{{ $json.comment.id }}`
- Set `comment_content` to `{{ $json.comment.content }}`
- Set `author_name` to `{{ $json.comment.author_name }}`

### 🎯 **Next Steps**

1. **Check N8N Executions tab** - Look for recent executions
2. **Re-execute workflow** - Click "Execute Workflow" button
3. **Add debug nodes** - To see what data is being received
4. **Check node connections** - Ensure all nodes are properly connected
5. **Test with simple data** - Use the test commands above

### 📞 **If Still Not Working**

Share:
1. Screenshot of N8N executions tab
2. Screenshot of workflow canvas
3. Any error messages you see
4. Configuration of nodes after the webhook

The webhook is definitely receiving data (we confirmed this), so the issue is likely in the workflow processing or node configuration.
