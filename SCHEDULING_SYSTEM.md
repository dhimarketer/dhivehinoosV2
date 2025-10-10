# Article Scheduling System

This document describes the comprehensive article scheduling system implemented for the Dhivehinoos.net website.

## Overview

The scheduling system allows administrators to:
- Configure multiple publishing schedules with different frequencies
- Set forbidden hours when articles should not be published
- Set daily limits on article publishing
- Schedule articles for future publishing
- Process scheduled articles automatically

## Models

### PublishingSchedule

Configuration for article publishing schedules.

**Fields:**
- `name`: Unique name for the schedule
- `is_active`: Whether this schedule is currently active
- `frequency`: Publishing frequency (instant, hourly, daily, weekly, custom)
- `custom_interval_minutes`: Custom interval in minutes (for custom frequency)
- `forbidden_hours_start`: Start of forbidden hours (e.g., 22:00)
- `forbidden_hours_end`: End of forbidden hours (e.g., 08:00)
- `max_articles_per_day`: Maximum articles to publish per day
- `queue_priority`: Priority for this schedule (higher = more priority)

**Methods:**
- `get_interval_minutes()`: Returns interval in minutes based on frequency
- `is_time_allowed(datetime_obj)`: Checks if given time is within allowed hours
- `get_next_publish_time(last_publish_time)`: Calculates next allowed publish time

### ScheduledArticle

Articles queued for scheduled publishing.

**Fields:**
- `article`: OneToOne relationship to Article
- `schedule`: Foreign key to PublishingSchedule
- `status`: Current status (queued, scheduled, published, failed, cancelled)
- `scheduled_publish_time`: When this article should be published
- `priority`: Priority within the schedule
- `published_at`: When the article was actually published
- `failure_reason`: Reason for failure if status is 'failed'

**Methods:**
- `can_publish_now()`: Checks if article can be published now
- `publish()`: Publishes the article

### Article (Updated)

Enhanced with scheduling capabilities.

**New Fields:**
- `publishing_mode`: How article should be published (instant, scheduled)
- `scheduled_publish_time`: When article should be published
- `status`: Now includes 'scheduled' option

**New Methods:**
- `schedule_for_publishing(schedule)`: Schedules article for publishing
- `publish_now()`: Publishes article immediately

## Services

### ArticleSchedulingService

Main service class for managing article scheduling.

**Methods:**
- `get_default_schedule()`: Gets the default active schedule
- `schedule_article(article, schedule, custom_time)`: Schedules an article
- `process_scheduled_articles()`: Processes all ready articles
- `reschedule_article(scheduled_article, new_time)`: Reschedules an article
- `cancel_scheduled_article(scheduled_article)`: Cancels a scheduled article
- `get_schedule_stats(schedule)`: Gets statistics for a schedule

## API Endpoints

### Scheduling Management

- `GET /articles/schedules/` - List all publishing schedules
- `POST /articles/schedules/` - Create a new schedule
- `GET /articles/schedules/{id}/` - Get specific schedule
- `PUT /articles/schedules/{id}/` - Update schedule
- `DELETE /articles/schedules/{id}/` - Delete schedule

### Scheduled Articles

- `GET /articles/scheduled-articles/` - List scheduled articles
- `POST /articles/scheduled-articles/` - Create scheduled article
- `GET /articles/scheduled-articles/{id}/` - Get specific scheduled article
- `PUT /articles/scheduled-articles/{id}/` - Update scheduled article
- `DELETE /articles/scheduled-articles/{id}/` - Delete scheduled article

### Article Actions

- `POST /articles/schedule/{article_id}/` - Schedule an article
- `POST /articles/publish/{article_id}/` - Publish article immediately
- `POST /articles/reschedule/{scheduled_article_id}/` - Reschedule article
- `POST /articles/cancel/{scheduled_article_id}/` - Cancel scheduled article

### Statistics and Processing

- `GET /articles/schedule-stats/` - Get scheduling statistics
- `POST /articles/process-scheduled/` - Process scheduled articles

## Management Commands

### process_scheduled_articles

Processes all articles that are ready to be published.

**Usage:**
```bash
python manage.py process_scheduled_articles [options]
```

**Options:**
- `--dry-run`: Show what would be processed without actually publishing
- `--schedule-id ID`: Process only articles from a specific schedule
- `--verbose`: Show detailed output

### create_default_schedules

Creates default publishing schedules.

**Usage:**
```bash
python manage.py create_default_schedules [--force]
```

**Options:**
- `--force`: Recreate schedules even if they already exist

## Frontend Interface

### Admin Dashboard

The admin dashboard includes a new "Scheduling" tab with:

- **Statistics Overview**: Shows total scheduled, published today, queued, and failed articles
- **Process Button**: Manually trigger processing of scheduled articles
- **Schedule Management**: View and toggle active/inactive status of schedules
- **Scheduled Articles**: View all scheduled articles with ability to cancel them

### Article Creation/Editing

Enhanced article forms include:

- **Publishing Mode**: Choose between instant and scheduled publishing
- **Scheduled Time**: Set specific publish time (optional)
- **Status**: Includes scheduled status option

## Automation

### Cron Job Setup

To automatically process scheduled articles, set up a cron job:

```bash
# Edit crontab
crontab -e

# Add this line to run every 5 minutes
*/5 * * * * /home/mine/Documents/codingProjects/dhivehinoosV2/backend/scripts/process_scheduled_articles.sh
```

### Manual Processing

You can also process scheduled articles manually:

```bash
# Process all scheduled articles
python manage.py process_scheduled_articles

# Dry run to see what would be processed
python manage.py process_scheduled_articles --dry-run

# Process only specific schedule
python manage.py process_scheduled_articles --schedule-id 1
```

## Configuration Examples

### Default Schedules

The system creates these default schedules:

1. **Instant Publishing** (Active)
   - Frequency: Instant
   - Priority: 100
   - Description: Publish articles immediately when received

2. **Hourly Publishing** (Inactive)
   - Frequency: Hourly
   - Forbidden hours: 22:00 - 08:00
   - Daily limit: 10 articles
   - Priority: 50

3. **Daily Publishing** (Inactive)
   - Frequency: Daily
   - Forbidden hours: 22:00 - 08:00
   - Daily limit: 5 articles
   - Priority: 30

4. **Custom Interval (30 min)** (Inactive)
   - Frequency: Custom (30 minutes)
   - Forbidden hours: 22:00 - 08:00
   - Daily limit: 20 articles
   - Priority: 20

## API Integration

### Article Ingestion

The article ingestion API now supports scheduling:

```json
{
  "title": "Article Title",
  "content": "Article content...",
  "image_url": "https://example.com/image.jpg",
  "publishing_mode": "scheduled",
  "scheduled_publish_time": "2024-01-15T10:00:00Z",
  "schedule_id": 2
}
```

### Response Format

Scheduled articles include additional information:

```json
{
  "id": 1,
  "title": "Article Title",
  "status": "scheduled",
  "publishing_mode": "scheduled",
  "scheduled_publish_time": "2024-01-15T10:00:00Z",
  "scheduled_publish_info": {
    "id": 1,
    "schedule": {
      "id": 2,
      "name": "Hourly Publishing",
      "frequency": "hourly"
    },
    "status": "scheduled",
    "scheduled_publish_time": "2024-01-15T10:00:00Z",
    "can_publish_now": false
  }
}
```

## Error Handling

The system includes comprehensive error handling:

- **Schedule Validation**: Ensures schedules are properly configured
- **Time Validation**: Validates scheduled times are in the future
- **Daily Limits**: Respects daily publishing limits
- **Forbidden Hours**: Skips publishing during forbidden hours
- **Failure Tracking**: Records reasons for failed publications

## Monitoring

### Logs

The system logs all scheduling activities:

- Schedule creation and updates
- Article scheduling and publishing
- Processing results
- Errors and failures

### Statistics

The system provides real-time statistics:

- Total scheduled articles
- Articles published today
- Queued articles
- Failed articles
- Next scheduled publish time
- Daily limit status

## Best Practices

1. **Schedule Configuration**: Set up schedules based on your content strategy
2. **Forbidden Hours**: Configure appropriate forbidden hours for your audience
3. **Daily Limits**: Set reasonable daily limits to avoid overwhelming readers
4. **Monitoring**: Regularly check scheduling statistics and logs
5. **Testing**: Use dry-run mode to test schedule configurations
6. **Backup**: Keep backups of important scheduled articles

## Troubleshooting

### Common Issues

1. **Articles not publishing**: Check if schedule is active and time restrictions
2. **Daily limit reached**: Increase daily limit or wait for next day
3. **Forbidden hours**: Adjust forbidden hours or scheduled times
4. **Processing errors**: Check logs for specific error messages

### Debug Commands

```bash
# Check schedule statistics
python manage.py shell
>>> from articles.scheduling_service import ArticleSchedulingService
>>> stats = ArticleSchedulingService.get_schedule_stats()
>>> print(stats)

# Check scheduled articles
>>> from articles.models import ScheduledArticle
>>> scheduled = ScheduledArticle.objects.filter(status='scheduled')
>>> for sa in scheduled:
...     print(f"{sa.article.title} - {sa.scheduled_publish_time}")
```
