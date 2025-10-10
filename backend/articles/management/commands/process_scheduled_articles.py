"""
Management command to process scheduled articles
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from articles.scheduling_service import ArticleSchedulingService
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Process scheduled articles and publish them when ready'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be processed without actually publishing',
        )
        parser.add_argument(
            '--schedule-id',
            type=int,
            help='Process only articles from a specific schedule',
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Show detailed output',
        )
    
    def handle(self, *args, **options):
        dry_run = options['dry_run']
        schedule_id = options['schedule_id']
        verbose = options['verbose']
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('DRY RUN MODE - No articles will be published')
            )
        
        # Get the schedule to process
        if schedule_id:
            try:
                from articles.models import PublishingSchedule
                schedule = PublishingSchedule.objects.get(id=schedule_id)
                self.stdout.write(f"Processing schedule: {schedule.name}")
            except PublishingSchedule.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'Schedule with ID {schedule_id} not found')
                )
                return
        else:
            schedule = ArticleSchedulingService.get_default_schedule()
            if not schedule:
                self.stdout.write(
                    self.style.ERROR('No active publishing schedule found')
                )
                return
            self.stdout.write(f"Processing default schedule: {schedule.name}")
        
        # Get articles ready for publishing
        from articles.models import ScheduledArticle
        
        ready_articles = ScheduledArticle.objects.filter(
            schedule=schedule,
            status__in=['queued', 'scheduled'],
            scheduled_publish_time__lte=timezone.now()
        ).select_related('article').order_by('scheduled_publish_time', '-priority')
        
        if not ready_articles.exists():
            self.stdout.write(
                self.style.SUCCESS('No articles ready for publishing')
            )
            return
        
        self.stdout.write(f"Found {ready_articles.count()} articles ready for publishing:")
        
        for scheduled_article in ready_articles:
            article = scheduled_article.article
            self.stdout.write(
                f"  - {article.title} (scheduled for {scheduled_article.scheduled_publish_time})"
            )
            
            if verbose:
                self.stdout.write(f"    Status: {scheduled_article.status}")
                self.stdout.write(f"    Priority: {scheduled_article.priority}")
                self.stdout.write(f"    Can publish now: {scheduled_article.can_publish_now()}")
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(f'Would process {ready_articles.count()} articles')
            )
            return
        
        # Process the articles
        self.stdout.write("Processing articles...")
        results = ArticleSchedulingService.process_scheduled_articles()
        
        # Display results
        self.stdout.write(
            self.style.SUCCESS(
                f"Processing complete: {results['published']} published, "
                f"{results['failed']} failed, {results['processed']} processed"
            )
        )
        
        if results['errors']:
            self.stdout.write(self.style.ERROR("Errors encountered:"))
            for error in results['errors']:
                self.stdout.write(f"  - {error}")
        
        # Show schedule stats
        stats = ArticleSchedulingService.get_schedule_stats(schedule)
        self.stdout.write(f"\nSchedule Statistics:")
        self.stdout.write(f"  Total scheduled: {stats['total_scheduled']}")
        self.stdout.write(f"  Queued: {stats['queued']}")
        self.stdout.write(f"  Scheduled: {stats['scheduled']}")
        self.stdout.write(f"  Published today: {stats['published_today']}")
        if stats['daily_limit']:
            self.stdout.write(f"  Daily limit: {stats['daily_limit']}")
            if stats['daily_limit_reached']:
                self.stdout.write(
                    self.style.WARNING("  Daily limit reached!")
                )
        if stats['next_publish_time']:
            self.stdout.write(f"  Next publish time: {stats['next_publish_time']}")
