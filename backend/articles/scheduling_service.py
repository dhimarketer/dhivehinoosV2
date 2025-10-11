"""
Scheduling service for article publishing
"""
from django.utils import timezone
from django.db import transaction
from .models import Article, PublishingSchedule, ScheduledArticle
import logging

logger = logging.getLogger(__name__)


class ArticleSchedulingService:
    """Service class for managing article scheduling and publishing"""
    
    @staticmethod
    def get_default_schedule():
        """Get the default active publishing schedule"""
        return PublishingSchedule.get_active_schedule()
    
    @staticmethod
    def schedule_article(article, schedule=None, custom_time=None):
        """
        Schedule an article for publishing
        
        Args:
            article: Article instance to schedule
            schedule: PublishingSchedule instance (optional, uses default if not provided)
            custom_time: Custom datetime for publishing (optional)
        
        Returns:
            ScheduledArticle instance
        """
        if article.status not in ['draft', 'scheduled']:
            raise ValueError(f"Cannot schedule article with status: {article.status}")
        
        if not schedule:
            schedule = ArticleSchedulingService.get_default_schedule()
            if not schedule:
                raise ValueError("No active publishing schedule found")
        
        # Ensure the schedule is active
        if not schedule.is_active:
            logger.warning(f"Schedule '{schedule.name}' is not active, using default active schedule")
            schedule = ArticleSchedulingService.get_default_schedule()
            if not schedule:
                raise ValueError("No active publishing schedule found")
        
        # Calculate publish time
        if custom_time:
            publish_time = custom_time
        else:
            publish_time = schedule.get_next_publish_time()
        
        # Update article
        article.status = 'scheduled'
        article.scheduled_publish_time = publish_time
        article.save()
        
        # Create scheduled article record
        scheduled_article, created = ScheduledArticle.objects.get_or_create(
            article=article,
            defaults={
                'schedule': schedule,
                'scheduled_publish_time': publish_time,
                'status': 'scheduled'
            }
        )
        
        if not created:
            # Update existing record
            scheduled_article.schedule = schedule
            scheduled_article.scheduled_publish_time = publish_time
            scheduled_article.status = 'scheduled'
            scheduled_article.save()
        
        logger.info(f"Scheduled article '{article.title}' for {publish_time} using schedule '{schedule.name}'")
        return scheduled_article
    
    @staticmethod
    def process_scheduled_articles():
        """
        Process all articles that are ready to be published
        This method should be called periodically (e.g., via cron job)
        
        Returns:
            dict with processing results
        """
        results = {
            'processed': 0,
            'published': 0,
            'failed': 0,
            'reassigned': 0,
            'errors': []
        }
        
        # Get all scheduled articles that are ready to publish
        # Use the same logic as the management command
        ready_articles = ScheduledArticle.objects.filter(
            status__in=['queued', 'scheduled'],
            scheduled_publish_time__lte=timezone.now()
        ).select_related('article', 'schedule').order_by('scheduled_publish_time', '-priority')
        
        logger.info(f"Found {ready_articles.count()} articles ready for publishing")
        
        # Get the active schedule for reassignment
        active_schedule = ArticleSchedulingService.get_default_schedule()
        
        for scheduled_article in ready_articles:
            results['processed'] += 1
            
            try:
                # If the article is on an inactive schedule, reassign it to the active schedule
                if not scheduled_article.schedule.is_active and active_schedule:
                    logger.info(f"Reassigning article '{scheduled_article.article.title}' from inactive schedule '{scheduled_article.schedule.name}' to active schedule '{active_schedule.name}'")
                    
                    # Calculate new publish time based on active schedule
                    new_publish_time = active_schedule.get_next_publish_time()
                    
                    # Update the scheduled article
                    scheduled_article.schedule = active_schedule
                    scheduled_article.scheduled_publish_time = new_publish_time
                    scheduled_article.save()
                    
                    # Update the article's scheduled time as well
                    scheduled_article.article.scheduled_publish_time = new_publish_time
                    scheduled_article.article.save()
                    
                    results['reassigned'] += 1
                    logger.info(f"Reassigned article '{scheduled_article.article.title}' to {new_publish_time}")
                    continue
                
                # Check if we can publish now (respecting time restrictions)
                if not scheduled_article.can_publish_now():
                    logger.info(f"Skipping article '{scheduled_article.article.title}' - time not allowed")
                    continue
                
                # Check daily limits
                if scheduled_article.schedule.max_articles_per_day:
                    today = timezone.now().date()
                    published_today = ScheduledArticle.objects.filter(
                        schedule=scheduled_article.schedule,
                        status='published',
                        published_at__date=today
                    ).count()
                    
                    if published_today >= scheduled_article.schedule.max_articles_per_day:
                        logger.info(f"Skipping article '{scheduled_article.article.title}' - daily limit reached")
                        continue
                
                # Publish the article
                with transaction.atomic():
                    if scheduled_article.publish():
                        results['published'] += 1
                        logger.info(f"Successfully published article '{scheduled_article.article.title}'")
                    else:
                        results['failed'] += 1
                        logger.error(f"Failed to publish article '{scheduled_article.article.title}'")
                        
            except Exception as e:
                results['failed'] += 1
                results['errors'].append(f"Error processing article '{scheduled_article.article.title}': {str(e)}")
                logger.error(f"Error processing article '{scheduled_article.article.title}': {str(e)}")
        
        logger.info(f"Processing complete: {results}")
        return results
    
    @staticmethod
    def reschedule_article(scheduled_article, new_time=None):
        """
        Reschedule an article for a different time
        
        Args:
            scheduled_article: ScheduledArticle instance
            new_time: New datetime for publishing (optional, uses schedule to calculate)
        
        Returns:
            Updated ScheduledArticle instance
        """
        if scheduled_article.status not in ['queued', 'scheduled']:
            raise ValueError(f"Cannot reschedule article with status: {scheduled_article.status}")
        
        if new_time:
            publish_time = new_time
        else:
            publish_time = scheduled_article.schedule.get_next_publish_time()
        
        scheduled_article.scheduled_publish_time = publish_time
        scheduled_article.status = 'scheduled'
        scheduled_article.save()
        
        # Update the article record
        scheduled_article.article.scheduled_publish_time = publish_time
        scheduled_article.article.save()
        
        logger.info(f"Rescheduled article '{scheduled_article.article.title}' for {publish_time}")
        return scheduled_article
    
    @staticmethod
    def cancel_scheduled_article(scheduled_article):
        """
        Cancel a scheduled article
        
        Args:
            scheduled_article: ScheduledArticle instance
        
        Returns:
            Updated ScheduledArticle instance
        """
        scheduled_article.status = 'cancelled'
        scheduled_article.save()
        
        # Update the article record
        scheduled_article.article.status = 'draft'
        scheduled_article.article.scheduled_publish_time = None
        scheduled_article.article.save()
        
        logger.info(f"Cancelled scheduled article '{scheduled_article.article.title}'")
        return scheduled_article
    
    @staticmethod
    def get_schedule_stats(schedule=None):
        """
        Get statistics for a publishing schedule
        
        Args:
            schedule: PublishingSchedule instance (optional, uses default if not provided)
        
        Returns:
            dict with statistics
        """
        if not schedule:
            schedule = ArticleSchedulingService.get_default_schedule()
            if not schedule:
                return {}
        
        now = timezone.now()
        today = now.date()
        
        stats = {
            'schedule_name': schedule.name,
            'total_scheduled': ScheduledArticle.objects.filter(schedule=schedule).count(),
            'queued': ScheduledArticle.objects.filter(schedule=schedule, status='queued').count(),
            'scheduled': ScheduledArticle.objects.filter(schedule=schedule, status='scheduled').count(),
            'published_today': ScheduledArticle.objects.filter(
                schedule=schedule,
                status='published',
                published_at__date=today
            ).count(),
            'failed': ScheduledArticle.objects.filter(schedule=schedule, status='failed').count(),
            'next_publish_time': None,
            'daily_limit': schedule.max_articles_per_day,
            'daily_limit_reached': False
        }
        
        # Get next scheduled publish time
        next_scheduled = ScheduledArticle.objects.filter(
            schedule=schedule,
            status__in=['queued', 'scheduled'],
            scheduled_publish_time__gt=now
        ).order_by('scheduled_publish_time').first()
        
        if next_scheduled:
            stats['next_publish_time'] = next_scheduled.scheduled_publish_time
        
        # Check if daily limit is reached
        if schedule.max_articles_per_day:
            stats['daily_limit_reached'] = stats['published_today'] >= schedule.max_articles_per_day
        
        return stats
