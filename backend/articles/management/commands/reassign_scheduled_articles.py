"""
Management command to reassign articles from inactive schedules to the active schedule
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from articles.models import PublishingSchedule, ScheduledArticle
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Reassign articles from inactive schedules to the active schedule'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be reassigned without actually reassigning',
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Show detailed output',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force reassignment even if no active schedule exists',
        )
    
    def handle(self, *args, **options):
        dry_run = options['dry_run']
        verbose = options['verbose']
        force = options['force']
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('DRY RUN MODE - No articles will be reassigned')
            )
        
        # Get the active schedule
        active_schedule = PublishingSchedule.get_active_schedule()
        if not active_schedule:
            if force:
                self.stdout.write(
                    self.style.ERROR('No active schedule found. Use --force to reassign anyway.')
                )
                return
            else:
                self.stdout.write(
                    self.style.ERROR('No active schedule found. Create an active schedule first.')
                )
                return
        
        self.stdout.write(f"Active schedule: {active_schedule.name}")
        
        # Get all scheduled articles from inactive schedules
        inactive_schedules = PublishingSchedule.objects.filter(is_active=False)
        articles_to_reassign = ScheduledArticle.objects.filter(
            schedule__in=inactive_schedules,
            status__in=['queued', 'scheduled']
        ).select_related('article', 'schedule').order_by('scheduled_publish_time')
        
        if not articles_to_reassign.exists():
            self.stdout.write(
                self.style.SUCCESS('No articles found on inactive schedules to reassign')
            )
            return
        
        self.stdout.write(f"Found {articles_to_reassign.count()} articles on inactive schedules:")
        
        for scheduled_article in articles_to_reassign:
            article = scheduled_article.article
            old_schedule = scheduled_article.schedule
            old_time = scheduled_article.scheduled_publish_time
            
            # Calculate new publish time
            new_publish_time = active_schedule.get_next_publish_time()
            
            self.stdout.write(
                f"  - {article.title}"
            )
            self.stdout.write(f"    From: {old_schedule.name} (scheduled for {old_time})")
            self.stdout.write(f"    To: {active_schedule.name} (new time: {new_publish_time})")
            
            if verbose:
                self.stdout.write(f"    Status: {scheduled_article.status}")
                self.stdout.write(f"    Priority: {scheduled_article.priority}")
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(f'Would reassign {articles_to_reassign.count()} articles')
            )
            return
        
        # Perform the reassignment
        self.stdout.write("Reassigning articles...")
        reassigned_count = 0
        
        for scheduled_article in articles_to_reassign:
            try:
                # Calculate new publish time based on active schedule
                new_publish_time = active_schedule.get_next_publish_time()
                
                # Update the scheduled article
                scheduled_article.schedule = active_schedule
                scheduled_article.scheduled_publish_time = new_publish_time
                scheduled_article.save()
                
                # Update the article's scheduled time as well
                scheduled_article.article.scheduled_publish_time = new_publish_time
                scheduled_article.article.save()
                
                reassigned_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f"✅ Reassigned: {scheduled_article.article.title}")
                )
                
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"❌ Failed to reassign {scheduled_article.article.title}: {str(e)}")
                )
        
        # Display results
        self.stdout.write(
            self.style.SUCCESS(
                f"Reassignment complete: {reassigned_count} articles reassigned to '{active_schedule.name}'"
            )
        )
        
        # Show updated schedule stats
        stats = active_schedule.get_schedule_stats()
        self.stdout.write(f"\nUpdated Schedule Statistics:")
        self.stdout.write(f"  Total scheduled: {stats['total_scheduled']}")
        self.stdout.write(f"  Queued: {stats['queued']}")
        self.stdout.write(f"  Scheduled: {stats['scheduled']}")
        self.stdout.write(f"  Published today: {stats['published_today']}")
        if stats['next_publish_time']:
            self.stdout.write(f"  Next publish time: {stats['next_publish_time']}")
