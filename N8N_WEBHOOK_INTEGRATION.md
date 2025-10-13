# n8n Webhook Integration for Dhivehinoos.net

This guide explains how to use the custom n8n node to receive and process webhooks from your Dhivehinoos.net site.

## Overview

Your Dhivehinoos.net site sends webhooks when comments are approved. The webhook payload includes:
- Comment details (content, author, approval status)
- Article information (title, URL, status)
- Category information
- Site metadata

## Installation

### 1. Install the Custom Node

1. Copy `n8n-webhook-node.js` to your n8n custom nodes directory:
   ```bash
   # If using Docker
   docker cp n8n-webhook-node.js <container_name>:/home/node/.n8n/custom/
   
   # If using local installation
   cp n8n-webhook-node.js ~/.n8n/custom/
   ```

2. Restart n8n:
   ```bash
   # Docker
   docker restart <n8n_container>
   
   # Local
   n8n restart
   ```

### 2. Configure Your Site

1. Go to your Dhivehinoos.net admin panel
2. Navigate to Settings → Webhook Settings
3. Enable "Enable Comment Webhook"
4. Set your n8n webhook URL: `https://your-n8n-instance.com/webhook/dhivehinoos-comment`
5. Optionally set a webhook secret for authentication
6. Test the webhook configuration

## Usage

### Basic Workflow

1. **Create a new n8n workflow**
2. **Add the "Dhivehinoos Comment Webhook" node**
3. **Configure the node:**
   - **Webhook Secret**: Enter the same secret you configured in your site settings (optional)
   - **Process Comment Data**: Enable to structure the comment data
   - **Extract Article Info**: Enable to include article details
   - **Extract Category Info**: Enable to include category details

### Webhook Payload Structure

The webhook sends the following JSON structure:

```json
{
  "event_type": "comment_approved",
  "timestamp": "2024-01-15T10:30:00Z",
  "comment": {
    "id": 123,
    "content": "Great article!",
    "author_name": "John Doe",
    "ip_address": "192.168.1.1",
    "is_approved": true,
    "created_at": "2024-01-15T10:25:00Z",
    "article": {
      "id": 456,
      "title": "Sample Article",
      "slug": "sample-article",
      "url": "https://dhivehinoos.net/articles/sample-article/",
      "status": "published",
      "created_at": "2024-01-15T09:00:00Z"
    },
    "category": {
      "id": 789,
      "name": "Technology",
      "slug": "technology"
    }
  },
  "site": {
    "name": "Dhivehinoos.net",
    "url": "https://dhivehinoos.net"
  }
}
```

### Processed Output Structure

The node processes the webhook and outputs:

```json
{
  "event_type": "comment_approved",
  "timestamp": "2024-01-15T10:30:00Z",
  "site": {
    "name": "Dhivehinoos.net",
    "url": "https://dhivehinoos.net"
  },
  "comment": {
    "id": 123,
    "content": "Great article!",
    "author_name": "John Doe",
    "ip_address": "192.168.1.1",
    "is_approved": true,
    "created_at": "2024-01-15T10:25:00Z"
  },
  "article": {
    "id": 456,
    "title": "Sample Article",
    "slug": "sample-article",
    "url": "https://dhivehinoos.net/articles/sample-article/",
    "status": "published",
    "created_at": "2024-01-15T09:00:00Z"
  },
  "category": {
    "id": 789,
    "name": "Technology",
    "slug": "technology"
  },
  "metadata": {
    "processed_at": "2024-01-15T10:30:05Z",
    "webhook_source": "dhivehinoos.net",
    "node_version": "1.0.0"
  }
}
```

## Example Workflows

### 1. Comment Notification Workflow

```javascript
// After the webhook node, add:
// 1. Slack node to send notifications
// 2. Email node to notify moderators
// 3. Database node to log comments

// Slack notification example:
{
  "channel": "#moderation",
  "text": `New approved comment on "${$json.article.title}"`,
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": `*New Comment Approved*\n\n*Article:* ${$json.article.title}\n*Author:* ${$json.comment.author_name}\n*Content:* ${$json.comment.content}\n*URL:* ${$json.article.url}`
      }
    }
  ]
}
```

### 2. Comment Analytics Workflow

```javascript
// Process comment data for analytics:
// 1. Extract comment metrics
// 2. Update analytics dashboard
// 3. Track engagement by category

const analyticsData = {
  comment_id: $json.comment.id,
  article_id: $json.article.id,
  category: $json.category.name,
  timestamp: $json.timestamp,
  author_type: $json.comment.author_name === "Anonymous" ? "anonymous" : "registered"
};
```

### 3. Content Moderation Workflow

```javascript
// Advanced moderation workflow:
// 1. Check comment content against moderation rules
// 2. Flag suspicious comments
// 3. Auto-respond to certain comment types

if ($json.comment.content.includes("spam_keyword")) {
  // Flag for manual review
  return {
    action: "flag_for_review",
    reason: "potential_spam",
    comment_id: $json.comment.id
  };
}
```

## Security Considerations

1. **Webhook Secret**: Always use a webhook secret for authentication
2. **HTTPS**: Ensure your n8n instance uses HTTPS
3. **Rate Limiting**: Consider implementing rate limiting for webhook endpoints
4. **Validation**: The node validates webhook structure and secret

## Troubleshooting

### Common Issues

1. **Webhook not triggering**:
   - Check if webhook is enabled in site settings
   - Verify webhook URL is correct
   - Check n8n logs for errors

2. **Invalid webhook secret**:
   - Ensure secret matches in both site settings and n8n node
   - Check for case sensitivity

3. **Malformed payload**:
   - Verify webhook payload structure
   - Check site logs for webhook sending errors

### Testing

Use the "Test Webhook" button in your site's admin panel to verify the webhook configuration.

## Advanced Configuration

### Custom Processing

You can modify the node to add custom processing logic:

```javascript
// Add custom fields
processedData.custom_field = "custom_value";

// Add business logic
if (comment.content.length > 100) {
  processedData.is_long_comment = true;
}
```

### Error Handling

The node includes comprehensive error handling:
- Invalid webhook secret
- Malformed payload
- Missing required fields
- Network errors

## Support

For issues with the webhook integration:
1. Check n8n execution logs
2. Verify site webhook settings
3. Test webhook manually using curl:

```bash
curl -X POST https://your-n8n-instance.com/webhook/dhivehinoos-comment \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: your_secret" \
  -d '{"test": "payload"}'
```
