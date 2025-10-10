# Email Subscription & RSS Feed System

This document describes the comprehensive email subscription and RSS feed system implemented for the Dhivehinoos.net website.

## Overview

The system provides:
- **Email Newsletter Subscription**: Users can subscribe to receive newsletters
- **RSS/Atom Feeds**: Multiple feed formats for content syndication
- **Subscription Management**: Admin interface for managing subscribers and campaigns
- **Email Campaigns**: Create and send email newsletters to subscribers

## Email Subscription System

### Models

#### NewsletterSubscription

Email subscription management.

**Fields:**
- `email`: Unique email address
- `first_name`, `last_name`: Optional subscriber names
- `status`: Subscription status (active, unsubscribed, pending, bounced)
- `subscription_token`: UUID for confirmation
- `unsubscribe_token`: UUID for unsubscribing
- `ip_address`, `user_agent`: Technical tracking
- `source`: Where subscription came from
- `subscribed_at`, `confirmed_at`, `unsubscribed_at`: Timestamps
- `last_email_sent`: Last email sent to subscriber
- `notes`: Admin notes

**Methods:**
- `confirm_subscription()`: Confirm pending subscription
- `unsubscribe()`: Unsubscribe user
- `is_active`: Property to check if subscription is active
- `full_name`: Property to get full name

#### EmailCampaign

Email campaign management.

**Fields:**
- `title`: Campaign title
- `subject`: Email subject line
- `content`: HTML email content
- `plain_text_content`: Plain text version
- `status`: Campaign status (draft, scheduled, sending, sent, failed)
- `scheduled_send_time`: When to send (optional)
- `target_categories`: Categories to target
- `exclude_unsubscribed`: Whether to exclude unsubscribed users
- Statistics fields: `total_recipients`, `emails_sent`, `emails_delivered`, etc.

**Methods:**
- `get_recipients()`: Get list of recipients
- `send_campaign()`: Send the campaign

### API Endpoints

#### Subscription Management

- `GET /api/v1/subscriptions/subscriptions/` - List all subscriptions
- `POST /api/v1/subscriptions/subscriptions/` - Create subscription
- `GET /api/v1/subscriptions/subscriptions/{id}/` - Get specific subscription
- `PUT /api/v1/subscriptions/subscriptions/{id}/` - Update subscription
- `DELETE /api/v1/subscriptions/subscriptions/{id}/` - Delete subscription

#### Public Subscription

- `POST /api/v1/subscriptions/subscribe/` - Subscribe to newsletter
- `GET /api/v1/subscriptions/confirm/{token}/` - Confirm subscription
- `GET /api/v1/subscriptions/unsubscribe/{token}/` - Unsubscribe via API
- `GET /api/v1/subscriptions/unsubscribe-page/{token}/` - Unsubscribe page

#### Campaign Management

- `GET /api/v1/subscriptions/campaigns/` - List campaigns
- `POST /api/v1/subscriptions/campaigns/` - Create campaign
- `GET /api/v1/subscriptions/campaigns/{id}/` - Get specific campaign
- `PUT /api/v1/subscriptions/campaigns/{id}/` - Update campaign
- `DELETE /api/v1/subscriptions/campaigns/{id}/` - Delete campaign
- `POST /api/v1/subscriptions/campaigns/{id}/send/` - Send campaign

#### Statistics

- `GET /api/v1/subscriptions/stats/` - Get subscription statistics

### Frontend Components

#### NewsletterSubscription Component

Multiple variants for different use cases:

**Variants:**
- `default`: Sidebar style with full form
- `inline`: Horizontal layout for content areas
- `modal`: Popup modal for subscription

**Features:**
- Email validation
- Optional name fields
- Success/error handling
- RSS feed links
- Responsive design

**Usage:**
```jsx
// Inline subscription
<NewsletterSubscription variant="inline" showTitle={true} />

// Modal subscription
<NewsletterSubscription variant="modal" />

// Sidebar subscription
<NewsletterSubscription variant="default" />
```

#### SubscriptionManagement Component

Admin interface for managing subscriptions and campaigns.

**Features:**
- Subscription statistics dashboard
- Subscriber management with search and filtering
- Email campaign creation and management
- Campaign sending and tracking

## RSS Feed System

### Feed Types

#### LatestArticlesFeed

Main RSS feed for latest articles.

**URL:** `/api/v1/articles/rss/`

**Features:**
- Latest 20 published articles
- Dynamic title and description from site settings
- Article images as enclosures
- Category information
- Publication and update dates

#### CategoryFeed

Category-specific RSS feed.

**URL:** `/api/v1/articles/rss/category/{category_slug}/`

**Features:**
- Articles from specific category
- Category-specific title and description
- Same article information as main feed

#### SearchFeed

Search results RSS feed.

**URL:** `/api/v1/articles/rss/search/?q={query}`

**Features:**
- Articles matching search query
- Search-specific title and description
- Searches title, content, and category names

#### AtomLatestArticlesFeed

Atom format feed for latest articles.

**URL:** `/api/v1/articles/atom/`

**Features:**
- Same content as RSS feed
- Atom 1.0 format
- Better support in some feed readers

### Feed Features

**Standard RSS Elements:**
- `<title>`: Article title
- `<description>`: Article content
- `<link>`: Link to article
- `<pubDate>`: Publication date
- `<guid>`: Unique identifier
- `<category>`: Article category
- `<enclosure>`: Article image

**Feed Metadata:**
- Dynamic site name and description
- Proper content type headers
- Last build date
- Language settings

## Integration Points

### Homepage Integration

The newsletter subscription component is integrated into the homepage:

- **Location**: After main content, before pagination
- **Variant**: Inline layout
- **Visibility**: Only shown when not searching
- **Features**: Email collection with RSS feed links

### Admin Dashboard Integration

Subscription management is integrated into the admin dashboard:

- **Tab**: New "Subscriptions" tab
- **Features**: 
  - Subscription statistics
  - Subscriber management
  - Campaign creation and sending
  - Search and filtering capabilities

### RSS Feed Discovery

RSS feeds are discoverable through:

1. **Direct URLs**: `/api/v1/articles/rss/`, `/api/v1/articles/atom/`
2. **Newsletter Component**: RSS/Atom buttons
3. **Meta Tags**: Can be added to HTML head
4. **Sitemap**: Can include feed URLs

## Usage Examples

### Subscribing to Newsletter

**Via Frontend:**
```jsx
// User fills out subscription form
<NewsletterSubscription variant="inline" />
```

**Via API:**
```bash
curl -X POST /api/v1/subscriptions/subscribe/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "source": "website"
  }'
```

### Creating Email Campaign

**Via Admin Interface:**
1. Go to Admin Dashboard → Subscriptions tab
2. Click "Create Campaign"
3. Fill out campaign details
4. Send immediately or schedule for later

**Via API:**
```bash
curl -X POST /api/v1/subscriptions/campaigns/ \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Weekly Newsletter",
    "subject": "Latest Dhivehi News",
    "content": "<h1>Welcome!</h1><p>Latest articles...</p>",
    "plain_text_content": "Welcome! Latest articles..."
  }'
```

### Accessing RSS Feeds

**Main Feed:**
```
https://dhivehinoos.net/api/v1/articles/rss/
```

**Category Feed:**
```
https://dhivehinoos.net/api/v1/articles/rss/category/politics/
```

**Search Feed:**
```
https://dhivehinoos.net/api/v1/articles/rss/search/?q=maldives
```

**Atom Feed:**
```
https://dhivehinoos.net/api/v1/articles/atom/
```

## Configuration

### Email Settings

For production use, configure email backend in Django settings:

```python
# settings.py
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'your-smtp-server.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'your-email@example.com'
EMAIL_HOST_PASSWORD = 'your-password'
DEFAULT_FROM_EMAIL = 'Dhivehinoos.net <noreply@dhivehinoos.net>'
```

### Feed Configuration

RSS feeds are automatically configured with:

- **Site Information**: From SiteSettings model
- **Article Content**: Full HTML content
- **Images**: Article images as enclosures
- **Categories**: Article categories
- **Timestamps**: Publication and update dates

## Security Considerations

### Subscription Security

- **Email Validation**: Proper email format validation
- **Duplicate Prevention**: Unique email constraint
- **Token-based Confirmation**: UUID tokens for confirmation/unsubscribe
- **IP Tracking**: Optional IP address tracking
- **Rate Limiting**: Can be added for subscription endpoints

### Feed Security

- **Public Access**: RSS feeds are publicly accessible
- **Content Filtering**: Only published articles included
- **No Sensitive Data**: No admin or user data exposed
- **Standard Format**: Follows RSS/Atom standards

## Monitoring and Analytics

### Subscription Metrics

Available statistics:
- Total subscribers
- Active subscribers
- Pending confirmations
- Unsubscribed count
- Bounced emails
- Daily/weekly/monthly subscription rates

### Campaign Metrics

Campaign tracking includes:
- Total recipients
- Emails sent
- Delivery rate
- Open rate (if tracking implemented)
- Click rate (if tracking implemented)
- Bounce rate

### Feed Analytics

RSS feed usage can be tracked through:
- Server access logs
- Feed reader user agents
- Direct feed access monitoring

## Best Practices

### Email Subscriptions

1. **Double Opt-in**: Implement confirmation emails
2. **Clear Unsubscribe**: Easy unsubscribe process
3. **Frequency Control**: Respect subscriber preferences
4. **Content Quality**: Provide valuable content
5. **Compliance**: Follow email marketing regulations

### RSS Feeds

1. **Consistent Updates**: Regular content updates
2. **Valid Format**: Ensure valid RSS/Atom format
3. **Complete Content**: Include full article content
4. **Proper Metadata**: Accurate titles, descriptions, dates
5. **Feed Discovery**: Make feeds easily discoverable

### Campaign Management

1. **Segmentation**: Target specific subscriber groups
2. **Testing**: Test campaigns before sending
3. **Scheduling**: Use appropriate send times
4. **Content Variety**: Mix of content types
5. **Performance Tracking**: Monitor campaign metrics

## Troubleshooting

### Common Issues

1. **Subscriptions Not Working**: Check email configuration
2. **Feeds Not Updating**: Verify article publication status
3. **Campaign Sending Failed**: Check email server settings
4. **High Bounce Rate**: Verify email addresses and content

### Debug Commands

```bash
# Check subscription statistics
python manage.py shell
>>> from subscriptions.models import NewsletterSubscription
>>> NewsletterSubscription.objects.filter(status='active').count()

# Test RSS feed
curl -H "Accept: application/rss+xml" /api/v1/articles/rss/

# Check campaign status
>>> from subscriptions.models import EmailCampaign
>>> campaigns = EmailCampaign.objects.all()
>>> for c in campaigns: print(f"{c.title}: {c.status}")
```

## Future Enhancements

### Potential Improvements

1. **Email Service Integration**: SendGrid, Mailchimp, AWS SES
2. **Advanced Segmentation**: Category-based targeting
3. **A/B Testing**: Campaign testing capabilities
4. **Analytics Integration**: Google Analytics for feeds
5. **Mobile App**: Push notifications for subscribers
6. **Social Sharing**: Social media integration
7. **Content Recommendations**: Personalized content suggestions

### RSS Enhancements

1. **Custom Feeds**: User-defined feed parameters
2. **Feed Categories**: Multiple category feeds
3. **Feed Authentication**: Private feeds for subscribers
4. **Podcast Support**: Audio content feeds
5. **Media Feeds**: Image and video content feeds
