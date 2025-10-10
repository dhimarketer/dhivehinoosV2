"""
Management command to create default publishing schedules
"""
from django.core.management.base import BaseCommand
from articles.models import PublishingSchedule
from django.utils import timezone


class Command(BaseCommand):
    help = 'Create default publishing schedules'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Recreate schedules even if they already exist',
        )
    
    def handle(self, *args, **options):
        force = options['force']
        
        default_schedules = [
            {
                'name': 'Instant Publishing',
                'frequency': 'instant',
                'is_active': True,
                'queue_priority': 100,
                'description': 'Publish articles immediately when received'
            },
            {
                'name': 'Hourly Publishing',
                'frequency': 'hourly',
                'is_active': False,
                'queue_priority': 50,
                'forbidden_hours_start': timezone.datetime.strptime('22:00', '%H:%M').time(),
                'forbidden_hours_end': timezone.datetime.strptime('08:00', '%H:%M').time(),
                'max_articles_per_day': 10,
                'description': 'Publish articles every hour, avoiding overnight hours'
            },
            {
                'name': 'Daily Publishing',
                'frequency': 'daily',
                'is_active': False,
                'queue_priority': 30,
                'forbidden_hours_start': timezone.datetime.strptime('22:00', '%H:%M').time(),
                'forbidden_hours_end': timezone.datetime.strptime('08:00', '%H:%M').time(),
                'max_articles_per_day': 5,
                'description': 'Publish articles once daily, avoiding overnight hours'
            },
            {
                'name': 'Custom Interval (30 min)',
                'frequency': 'custom',
                'custom_interval_minutes': 30,
                'is_active': False,
                'queue_priority': 20,
                'forbidden_hours_start': timezone.datetime.strptime('22:00', '%H:%M').time(),
                'forbidden_hours_end': timezone.datetime.strptime('08:00', '%H:%M').time(),
                'max_articles_per_day': 20,
                'description': 'Publish articles every 30 minutes, avoiding overnight hours'
            }
        ]
        
        created_count = 0
        updated_count = 0
        
        for schedule_data in default_schedules:
            description = schedule_data.pop('description', '')
            
            schedule, created = PublishingSchedule.objects.get_or_create(
                name=schedule_data['name'],
                defaults=schedule_data
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f"Created schedule: {schedule.name}")
                )
            elif force:
                # Update existing schedule
                for key, value in schedule_data.items():
                    setattr(schedule, key, value)
                schedule.save()
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f"Updated schedule: {schedule.name}")
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f"Schedule already exists: {schedule.name}")
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f"Schedule creation complete: {created_count} created, {updated_count} updated"
            )
        )
        
        # Show current schedules
        self.stdout.write("\nCurrent publishing schedules:")
        schedules = PublishingSchedule.objects.all().order_by('-queue_priority')
        for schedule in schedules:
            status = "ACTIVE" if schedule.is_active else "INACTIVE"
            self.stdout.write(f"  {schedule.name} ({status}) - {schedule.get_frequency_display()}")
