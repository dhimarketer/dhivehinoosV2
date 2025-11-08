from django.db import models
from django.utils.text import slugify
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
import re
import json
import os

# Reusable image models will be defined in this file


class Category(models.Model):
    """Article categories for organization and navigation"""
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True, blank=True)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=7, default='#3B82F6', help_text="Hex color code for UI")
    icon = models.CharField(max_length=50, default='📰', help_text="Emoji or icon identifier")
    keywords = models.TextField(help_text="Comma-separated keywords for auto-categorization")
    regex_patterns = models.TextField(blank=True, help_text="Regex patterns for categorization (one per line)")
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['sort_order', 'name']
        verbose_name_plural = 'Categories'
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
    def get_keywords_list(self):
        """Return keywords as a list"""
        return [kw.strip().lower() for kw in self.keywords.split(',') if kw.strip()]
    
    def get_regex_patterns_list(self):
        """Return regex patterns as a list"""
        return [pattern.strip() for pattern in self.regex_patterns.split('\n') if pattern.strip()]


class PublishingSchedule(models.Model):
    """Configuration for article publishing schedule"""
    
    FREQUENCY_CHOICES = [
        ('instant', 'Instant'),
        ('hourly', 'Hourly'),
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('custom', 'Custom Interval'),
    ]
    
    name = models.CharField(max_length=100, unique=True, help_text="Name for this schedule configuration")
    is_active = models.BooleanField(default=True, help_text="Whether this schedule is currently active")
    
    # Publishing frequency
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='instant')
    custom_interval_minutes = models.PositiveIntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(10080)],  # Max 1 week
        help_text="Custom interval in minutes (only used when frequency is 'custom')"
    )
    
    # Time restrictions
    forbidden_hours_start = models.TimeField(
        null=True, blank=True,
        help_text="Start of forbidden hours (e.g., 22:00 for 10 PM)"
    )
    forbidden_hours_end = models.TimeField(
        null=True, blank=True,
        help_text="End of forbidden hours (e.g., 08:00 for 8 AM)"
    )
    
    # Daily limits
    max_articles_per_day = models.PositiveIntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(100)],
        help_text="Maximum articles to publish per day (leave empty for no limit)"
    )
    
    # Queue management
    queue_priority = models.PositiveIntegerField(
        default=0,
        help_text="Priority for this schedule (higher number = higher priority)"
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-queue_priority', 'name']
        verbose_name = 'Publishing Schedule'
        verbose_name_plural = 'Publishing Schedules'
    
    def __str__(self):
        return f"{self.name} ({self.get_frequency_display()})"
    
    def get_interval_minutes(self):
        """Get the interval in minutes based on frequency setting"""
        if self.frequency == 'instant':
            return 0
        elif self.frequency == 'hourly':
            return 60
        elif self.frequency == 'daily':
            return 1440  # 24 hours
        elif self.frequency == 'weekly':
            return 10080  # 7 days
        elif self.frequency == 'custom':
            return self.custom_interval_minutes or 60
        return 60
    
    def is_time_allowed(self, datetime_obj=None):
        """Check if the given time is within allowed hours"""
        if not self.forbidden_hours_start or not self.forbidden_hours_end:
            return True
        
        if datetime_obj is None:
            # Ensure we get local timezone
            datetime_obj = timezone.localtime(timezone.now())
        else:
            # Convert to local timezone if it's timezone-aware
            if timezone.is_aware(datetime_obj):
                datetime_obj = timezone.localtime(datetime_obj)
        
        current_time = datetime_obj.time()
        
        # Handle overnight forbidden hours (e.g., 22:00 to 08:00)
        if self.forbidden_hours_start > self.forbidden_hours_end:
            return not (current_time >= self.forbidden_hours_start or current_time <= self.forbidden_hours_end)
        else:
            return not (self.forbidden_hours_start <= current_time <= self.forbidden_hours_end)
    
    def get_next_publish_time(self, last_publish_time=None):
        """Calculate the next allowed publish time"""
        if self.frequency == 'instant':
            return timezone.now()
        
        if last_publish_time is None:
            # Ensure we get local timezone
            last_publish_time = timezone.localtime(timezone.now())
        else:
            # Convert to local timezone if it's timezone-aware
            if timezone.is_aware(last_publish_time):
                last_publish_time = timezone.localtime(last_publish_time)
        
        interval_minutes = self.get_interval_minutes()
        next_time = last_publish_time + timezone.timedelta(minutes=interval_minutes)
        
        # If the next time falls in forbidden hours, move it to after forbidden hours
        if not self.is_time_allowed(next_time):
            if self.forbidden_hours_start and self.forbidden_hours_end:
                # Move to the end of forbidden hours
                if self.forbidden_hours_start > self.forbidden_hours_end:
                    # Overnight forbidden hours
                    if next_time.time() >= self.forbidden_hours_start:
                        # Move to next day after forbidden hours end
                        next_time = next_time.replace(
                            hour=self.forbidden_hours_end.hour,
                            minute=self.forbidden_hours_end.minute,
                            second=0,
                            microsecond=0
                        )
                        next_time += timezone.timedelta(days=1)
                    else:
                        # Move to forbidden hours end today
                        next_time = next_time.replace(
                            hour=self.forbidden_hours_end.hour,
                            minute=self.forbidden_hours_end.minute,
                            second=0,
                            microsecond=0
                        )
                else:
                    # Same day forbidden hours
                    next_time = next_time.replace(
                        hour=self.forbidden_hours_end.hour,
                        minute=self.forbidden_hours_end.minute,
                        second=0,
                        microsecond=0
                    )
        
        return next_time
    
    def save(self, *args, **kwargs):
        """Override save to ensure only one schedule is active at a time and reassign articles"""
        from django.utils import timezone
        
        # Check if this schedule is being activated
        was_activating = False
        if self.is_active and self.pk:
            # Check if this schedule was previously inactive
            try:
                old_schedule = PublishingSchedule.objects.get(pk=self.pk)
                was_activating = not old_schedule.is_active and self.is_active
            except PublishingSchedule.DoesNotExist:
                was_activating = True
        
        # Ensure only one schedule is active at a time
        if self.is_active:
            # Use update() for better performance instead of individual saves
            PublishingSchedule.objects.filter(is_active=True).exclude(pk=self.pk).update(is_active=False)
        
        super().save(*args, **kwargs)
        
        # If this schedule is being activated, reassign articles from inactive schedules
        if was_activating:
            self._reassign_articles_from_inactive_schedules()
    
    def _reassign_articles_from_inactive_schedules(self):
        """Reassign articles from inactive schedules to this active schedule"""
        from django.utils import timezone
        import logging
        
        logger = logging.getLogger(__name__)
        
        # Get all scheduled articles from inactive schedules
        inactive_schedules = PublishingSchedule.objects.filter(is_active=False)
        articles_to_reassign = ScheduledArticle.objects.filter(
            schedule__in=inactive_schedules,
            status__in=['queued', 'scheduled']
        ).select_related('article', 'schedule')
        
        if not articles_to_reassign.exists():
            logger.info(f"No articles found on inactive schedules to reassign")
            return
        
        logger.info(f"Reassigning {articles_to_reassign.count()} articles from inactive schedules to '{self.name}'")
        
        reassigned_count = 0
        for scheduled_article in articles_to_reassign:
            try:
                # Calculate new publish time based on this schedule
                new_publish_time = self.get_next_publish_time()
                
                # Update the scheduled article
                scheduled_article.schedule = self
                scheduled_article.scheduled_publish_time = new_publish_time
                scheduled_article.save()
                
                # Update the article's scheduled time as well
                scheduled_article.article.scheduled_publish_time = new_publish_time
                scheduled_article.article.save()
                
                reassigned_count += 1
                logger.info(f"Reassigned article '{scheduled_article.article.title}' from '{scheduled_article.schedule.name}' to '{self.name}' (new time: {new_publish_time})")
                
            except Exception as e:
                logger.error(f"Failed to reassign article '{scheduled_article.article.title}': {str(e)}")
        
        logger.info(f"Successfully reassigned {reassigned_count} articles to '{self.name}'")
    
    def get_schedule_stats(self):
        """Get statistics for this schedule"""
        from django.utils import timezone
        
        today = timezone.now().date()
        
        # Get all scheduled articles for this schedule
        scheduled_articles = ScheduledArticle.objects.filter(schedule=self)
        
        stats = {
            'total_scheduled': scheduled_articles.count(),
            'queued': scheduled_articles.filter(status='queued').count(),
            'scheduled': scheduled_articles.filter(status='scheduled').count(),
            'published_today': scheduled_articles.filter(
                status='published',
                published_at__date=today
            ).count(),
            'daily_limit': self.max_articles_per_day,
            'daily_limit_reached': False,
            'next_publish_time': None
        }
        
        # Check if daily limit is reached
        if self.max_articles_per_day and stats['published_today'] >= self.max_articles_per_day:
            stats['daily_limit_reached'] = True
        
        # Get next publish time
        try:
            stats['next_publish_time'] = self.get_next_publish_time()
        except Exception:
            stats['next_publish_time'] = None
        
        return stats
    
    @classmethod
    def get_active_schedule(cls):
        """Get the currently active schedule"""
        try:
            return cls.objects.get(is_active=True)
        except cls.DoesNotExist:
            return None
        except cls.MultipleObjectsReturned:
            # If somehow multiple schedules are active, get the first one and deactivate others
            active_schedules = cls.objects.filter(is_active=True)
            first_schedule = active_schedules.first()
            active_schedules.exclude(pk=first_schedule.pk).update(is_active=False)
            return first_schedule


class ScheduledArticle(models.Model):
    """Articles queued for scheduled publishing"""
    
    STATUS_CHOICES = [
        ('queued', 'Queued'),
        ('scheduled', 'Scheduled'),
        ('published', 'Published'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    article = models.OneToOneField('Article', on_delete=models.CASCADE, related_name='scheduled_publish')
    schedule = models.ForeignKey(PublishingSchedule, on_delete=models.CASCADE, related_name='scheduled_articles')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='queued')
    
    # Scheduling details
    scheduled_publish_time = models.DateTimeField(help_text="When this article should be published")
    priority = models.PositiveIntegerField(default=0, help_text="Priority within the schedule")
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)
    failure_reason = models.TextField(blank=True, help_text="Reason for failure if status is 'failed'")
    
    class Meta:
        ordering = ['scheduled_publish_time', '-priority']
        verbose_name = 'Scheduled Article'
        verbose_name_plural = 'Scheduled Articles'
    
    def __str__(self):
        return f"{self.article.title} - {self.scheduled_publish_time}"
    
    def can_publish_now(self):
        """Check if this article can be published now"""
        # Ensure we're working with local timezone
        now = timezone.localtime(timezone.now())
        scheduled_time = timezone.localtime(self.scheduled_publish_time) if timezone.is_aware(self.scheduled_publish_time) else self.scheduled_publish_time
        
        return (
            self.status in ['queued', 'scheduled'] and
            now >= scheduled_time and
            self.schedule.is_time_allowed(now)
        )
    
    def publish(self):
        """Publish the article"""
        if self.status not in ['queued', 'scheduled']:
            raise ValueError(f"Cannot publish article with status: {self.status}")
        
        if not self.can_publish_now():
            raise ValueError("Article is not ready to publish yet")
        
        try:
            self.article.status = 'published'
            self.article.save()
            
            self.status = 'published'
            self.published_at = timezone.now()
            self.save()
            
            return True
        except Exception as e:
            self.status = 'failed'
            self.failure_reason = str(e)
            self.save()
            return False


class ImageSettings(models.Model):
    """Settings for how images are displayed in articles"""
    
    IMAGE_FIT_CHOICES = [
        ('cover', 'Cover (crop to fit)'),
        ('contain', 'Contain (fit within bounds)'),
        ('fill', 'Fill (stretch to fit)'),
        ('scale-down', 'Scale Down (shrink if needed)'),
        ('none', 'None (original size)'),
    ]
    
    IMAGE_POSITION_CHOICES = [
        ('top', 'Top'),
        ('center', 'Center'),
        ('bottom', 'Bottom'),
        ('left', 'Left'),
        ('right', 'Right'),
        ('top-left', 'Top Left'),
        ('top-right', 'Top Right'),
        ('bottom-left', 'Bottom Left'),
        ('bottom-right', 'Bottom Right'),
    ]
    
    IMAGE_ORIENTATION_CHOICES = [
        ('auto', 'Auto-detect'),
        ('landscape', 'Landscape'),
        ('portrait', 'Portrait'),
        ('square', 'Square'),
    ]
    
    ASPECT_RATIO_CHOICES = [
        ('16:9', '16:9 (Widescreen)'),
        ('4:3', '4:3 (Standard)'),
        ('3:2', '3:2 (Classic)'),
        ('1:1', '1:1 (Square)'),
        ('21:9', '21:9 (Ultrawide)'),
        ('9:16', '9:16 (Portrait)'),
        ('custom', 'Custom'),
    ]
    
    QUALITY_CHOICES = [
        ('high', 'High Quality'),
        ('medium', 'Medium Quality'),
        ('low', 'Low Quality (Fast Loading)'),
    ]
    
    # Display settings
    image_fit = models.CharField(
        max_length=20,
        choices=IMAGE_FIT_CHOICES,
        default='cover',
        help_text="How images should fit within their containers"
    )
    
    image_position = models.CharField(
        max_length=20,
        choices=IMAGE_POSITION_CHOICES,
        default='top',
        help_text="Which part of the image should be visible when cropped"
    )
    
    image_orientation = models.CharField(
        max_length=20,
        choices=IMAGE_ORIENTATION_CHOICES,
        default='auto',
        help_text="Force specific orientation for all images"
    )
    
    # Size settings
    main_image_height = models.PositiveIntegerField(
        default=400,
        help_text="Height in pixels for main article images"
    )
    
    reuse_image_height = models.PositiveIntegerField(
        default=300,
        help_text="Height in pixels for reuse images"
    )
    
    thumbnail_height = models.PositiveIntegerField(
        default=150,
        help_text="Height in pixels for thumbnail images"
    )
    
    # Aspect ratio settings
    main_image_aspect_ratio = models.CharField(
        max_length=10,
        choices=ASPECT_RATIO_CHOICES,
        default='16:9',
        help_text="Aspect ratio for main images (e.g., 16:9, 4:3, 1:1)"
    )
    
    reuse_image_aspect_ratio = models.CharField(
        max_length=10,
        choices=ASPECT_RATIO_CHOICES,
        default='4:3',
        help_text="Aspect ratio for reuse images (e.g., 16:9, 4:3, 1:1)"
    )
    
    # Custom aspect ratio settings
    custom_main_width = models.PositiveIntegerField(
        default=16,
        help_text="Custom width for main image aspect ratio"
    )
    custom_main_height = models.PositiveIntegerField(
        default=9,
        help_text="Custom height for main image aspect ratio"
    )
    custom_reuse_width = models.PositiveIntegerField(
        default=4,
        help_text="Custom width for reuse image aspect ratio"
    )
    custom_reuse_height = models.PositiveIntegerField(
        default=3,
        help_text="Custom height for reuse image aspect ratio"
    )
    
    # Quality and performance settings
    image_quality = models.CharField(
        max_length=10,
        choices=QUALITY_CHOICES,
        default='medium',
        help_text="Image quality vs loading speed trade-off"
    )
    
    enable_lazy_loading = models.BooleanField(
        default=True,
        help_text="Enable lazy loading for better performance"
    )
    
    enable_webp_conversion = models.BooleanField(
        default=True,
        help_text="Convert images to WebP format for better compression"
    )
    
    # Responsive settings
    mobile_image_height = models.PositiveIntegerField(
        default=250,
        help_text="Height in pixels for mobile devices"
    )
    
    tablet_image_height = models.PositiveIntegerField(
        default=350,
        help_text="Height in pixels for tablet devices"
    )
    
    desktop_image_height = models.PositiveIntegerField(
        default=400,
        help_text="Height in pixels for desktop devices"
    )
    
    # Border and styling settings
    image_border_radius = models.PositiveIntegerField(
        default=8,
        help_text="Border radius in pixels for rounded corners"
    )
    
    image_shadow = models.BooleanField(
        default=True,
        help_text="Add shadow effect to images"
    )
    
    image_hover_effect = models.BooleanField(
        default=True,
        help_text="Add hover effects to images"
    )
    
    # Global settings
    is_active = models.BooleanField(
        default=True,
        help_text="Whether these settings are currently active"
    )
    
    settings_name = models.CharField(
        max_length=100,
        default="Default Image Settings",
        help_text="Name for this settings configuration"
    )
    
    description = models.TextField(
        blank=True,
        help_text="Description of this settings configuration"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Image Display Settings'
        verbose_name_plural = 'Image Display Settings'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.settings_name} ({self.image_fit}, {self.image_position})"
    
    @classmethod
    def get_active_settings(cls):
        """Get the currently active image display settings"""
        try:
            return cls.objects.filter(is_active=True).latest('created_at')
        except cls.DoesNotExist:
            # Return default settings if none exist
            return cls.objects.create(
                settings_name="Default Image Settings",
                description="Default image display settings",
                image_fit='cover',
                image_position='top',
                image_orientation='auto',
                main_image_height=400,
                reuse_image_height=300,
                thumbnail_height=150,
                main_image_aspect_ratio='16:9',
                reuse_image_aspect_ratio='4:3',
                custom_main_width=16,
                custom_main_height=9,
                custom_reuse_width=4,
                custom_reuse_height=3,
                image_quality='medium',
                enable_lazy_loading=True,
                enable_webp_conversion=True,
                mobile_image_height=250,
                tablet_image_height=350,
                desktop_image_height=400,
                image_border_radius=8,
                image_shadow=True,
                image_hover_effect=True,
                is_active=True
            )
    
    def get_aspect_ratio_percentage(self, aspect_ratio):
        """Convert aspect ratio string to CSS percentage"""
        try:
            if aspect_ratio == 'custom':
                # Use custom dimensions
                return None
            width, height = aspect_ratio.split(':')
            return (int(height) / int(width)) * 100
        except (ValueError, ZeroDivisionError):
            return 56.25  # Default 16:9 ratio
    
    def get_main_image_padding(self):
        """Get CSS padding-top percentage for main images"""
        if self.main_image_aspect_ratio == 'custom':
            return (self.custom_main_height / self.custom_main_width) * 100
        return self.get_aspect_ratio_percentage(self.main_image_aspect_ratio)
    
    def get_reuse_image_padding(self):
        """Get CSS padding-top percentage for reuse images"""
        if self.reuse_image_aspect_ratio == 'custom':
            return (self.custom_reuse_height / self.custom_reuse_width) * 100
        return self.get_aspect_ratio_percentage(self.reuse_image_aspect_ratio)
    
    def get_responsive_height(self, device_type='desktop'):
        """Get height based on device type"""
        height_map = {
            'mobile': self.mobile_image_height,
            'tablet': self.tablet_image_height,
            'desktop': self.desktop_image_height,
        }
        return height_map.get(device_type, self.desktop_image_height)
    
    def get_css_classes(self):
        """Get CSS classes for image styling"""
        classes = []
        
        if self.image_shadow:
            classes.append('image-shadow')
        
        if self.image_hover_effect:
            classes.append('image-hover')
        
        if self.enable_lazy_loading:
            classes.append('lazy-load')
        
        return ' '.join(classes)
    
    def get_image_styles(self):
        """Get inline CSS styles for images"""
        styles = {
            'border-radius': f'{self.image_border_radius}px',
            'object-fit': self.image_fit,
            'object-position': self.image_position,
        }
        
        if self.image_shadow:
            styles['box-shadow'] = '0 4px 8px rgba(0,0,0,0.1)'
        
        return styles


class Article(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('scheduled', 'Scheduled'),
    ]
    
    PUBLISHING_MODE_CHOICES = [
        ('instant', 'Instant'),
        ('scheduled', 'Scheduled'),
    ]
    
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, blank=True)
    proposed_url = models.CharField(max_length=500, blank=True, null=True, help_text="Custom URL path for this article (optional)")
    content = models.TextField()  # HTML allowed
    source_fragments = models.TextField(blank=True, null=True, help_text="Source fragments providing context for the story (will be displayed in italics)")
    image = models.URLField(blank=True, null=True, help_text="External image URL (optional)")
    image_file = models.ImageField(blank=True, null=True, upload_to='articles/', help_text="Uploaded image file (optional)")
    
    # Image reuse fields
    reused_image = models.ForeignKey(
        'ReusableImage', 
        null=True, 
        blank=True, 
        on_delete=models.SET_NULL,
        related_name='used_in_articles',
        help_text="Primary reusable image used for this article (for backward compatibility)"
    )
    reuse_images = models.ManyToManyField(
        'ReusableImage',
        blank=True,
        related_name='articles_using_image',
        help_text="Multiple reusable images that match this article content (max 4)"
    )
    image_source = models.CharField(
        max_length=20, 
        choices=[
            ('generated', 'AI Generated'),
            ('reused', 'Reused from Library'),
            ('external', 'External URL')
        ], 
        default='external',
        help_text="Source of the article image"
    )
    
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='articles')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Scheduling fields
    publishing_mode = models.CharField(
        max_length=20, 
        choices=PUBLISHING_MODE_CHOICES, 
        default='instant',
        help_text="How this article should be published"
    )
    scheduled_publish_time = models.DateTimeField(
        null=True, blank=True,
        help_text="When this article should be published (only used if publishing_mode is 'scheduled')"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Article'
        verbose_name_plural = 'Articles'
        indexes = [
            models.Index(fields=['status', '-created_at'], name='article_status_created_idx'),
            models.Index(fields=['slug'], name='article_slug_idx'),
            models.Index(fields=['category', 'status'], name='article_category_status_idx'),
            models.Index(fields=['status', 'created_at'], name='article_status_created_at_idx'),
        ]
    
    def __str__(self):
        return self.title
    
    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)
            # Ensure slug doesn't exceed Django's SlugField max_length (50)
            if len(base_slug) > 50:
                base_slug = base_slug[:50]
                # Remove trailing hyphens if any
                base_slug = base_slug.rstrip('-')
            
            slug = base_slug
            counter = 1
            while Article.objects.filter(slug=slug).exists():
                # Ensure counter addition doesn't exceed max_length
                counter_slug = f"{base_slug}-{counter}"
                if len(counter_slug) > 50:
                    # Truncate base_slug further to accommodate counter
                    available_length = 50 - len(f"-{counter}")
                    base_slug = base_slug[:available_length].rstrip('-')
                    counter_slug = f"{base_slug}-{counter}"
                slug = counter_slug
                counter += 1
            self.slug = slug
        
        # Auto-categorize if no category is set
        if not self.category:
            try:
                from .categorization_service import auto_categorize_article
                suggested_category = auto_categorize_article(self)
                if suggested_category:
                    self.category = suggested_category
            except Exception as e:
                # Don't fail article creation if categorization fails
                print(f"Auto-categorization failed: {e}")
        
        super().save(*args, **kwargs)
    
    @property
    def vote_score(self):
        """Calculate net vote score (upvotes - downvotes)"""
        upvotes = self.votes.filter(vote_type='up').count()
        downvotes = self.votes.filter(vote_type='down').count()
        return upvotes - downvotes
    
    @property
    def approved_comments_count(self):
        """Count of approved comments"""
        return self.comments.filter(is_approved=True).count()
    
    @property
    def image_url(self):
        """Return the image URL, either from image field or image_file field"""
        if self.image:
            return self.image
        elif self.image_file:
            return self.image_file.url
        return None
    
    @property
    def article_url(self):
        """Return the article URL path, using proposed_url if available, otherwise slug"""
        if self.proposed_url:
            # Clean the proposed URL to ensure it starts with /
            url = self.proposed_url.strip()
            if not url.startswith('/'):
                url = '/' + url
            return url
        elif self.slug:
            return f'/article/{self.slug}'
        return None
    
    def schedule_for_publishing(self, schedule=None):
        """Schedule this article for publishing using the given schedule or default schedule"""
        if self.status != 'draft':
            raise ValueError("Only draft articles can be scheduled for publishing")
        
        if not schedule:
            # Get the default active schedule
            schedule = PublishingSchedule.get_active_schedule()
            if not schedule:
                raise ValueError("No active publishing schedule found")
        
        # Calculate the next publish time
        next_publish_time = schedule.get_next_publish_time()
        
        # Update article status and scheduled time
        self.status = 'scheduled'
        self.scheduled_publish_time = next_publish_time
        self.save()
        
        # Create ScheduledArticle record
        scheduled_article, created = ScheduledArticle.objects.get_or_create(
            article=self,
            defaults={
                'schedule': schedule,
                'scheduled_publish_time': next_publish_time,
                'status': 'scheduled'
            }
        )
        
        return scheduled_article
    
    def publish_now(self):
        """Publish this article immediately"""
        if self.status == 'published':
            return True
        
        self.status = 'published'
        self.scheduled_publish_time = None
        self.save()
        
        # Update or remove scheduled article record
        if hasattr(self, 'scheduled_publish'):
            self.scheduled_publish.status = 'published'
            self.scheduled_publish.published_at = timezone.now()
            self.scheduled_publish.save()
        
        return True


class ImageReuseSettings(models.Model):
    """Settings for image reuse system"""
    
    # Auto-verification settings
    auto_verify_high_confidence = models.BooleanField(
        default=True,
        help_text="Automatically verify images with high confidence scores"
    )
    high_confidence_threshold = models.FloatField(
        default=0.9,
        help_text="Confidence threshold for auto-verification (0.0 to 1.0)"
    )
    
    # Manual verification settings
    require_manual_verification = models.BooleanField(
        default=False,
        help_text="Require manual verification for all image matches"
    )
    verification_required_for = models.JSONField(
        default=list,
        help_text="Entity types that require manual verification"
    )
    
    # Image selection settings
    prefer_verified_images = models.BooleanField(
        default=True,
        help_text="Prefer verified images over unverified ones"
    )
    allow_unverified_fallback = models.BooleanField(
        default=True,
        help_text="Allow fallback to unverified images if no verified ones available"
    )
    
    # Notification settings
    notify_on_pending_verification = models.BooleanField(
        default=True,
        help_text="Send email notifications for pending verifications"
    )
    verification_email_recipients = models.JSONField(
        default=list,
        help_text="Email addresses to notify about pending verifications"
    )
    
    # Name matching settings
    politician_name_patterns = models.JSONField(
        default=list,
        help_text="Regex patterns for extracting politician names"
    )
    institution_name_patterns = models.JSONField(
        default=list,
        help_text="Regex patterns for extracting institution names"
    )
    
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        'auth.User', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        help_text="User who last updated these settings"
    )
    
    class Meta:
        verbose_name = 'Image Reuse Settings'
        verbose_name_plural = 'Image Reuse Settings'
    
    def __str__(self):
        return "Image Reuse Settings"
    
    @classmethod
    def get_settings(cls):
        """Get or create settings instance"""
        obj, created = cls.objects.get_or_create(pk=1)
        if created:
            # Set default patterns
            obj.politician_name_patterns = [
                r'ރައްޔިތުން\s+([A-Za-z\s]+)',
                r'([A-Za-z\s]+)\s+ރައްޔިތުން',
                r'President\s+([A-Za-z\s]+)',
                r'([A-Za-z\s]+)\s+President',
                r'([A-Z][a-z]+\s+[A-Z][a-z]+\s+[A-Z][a-z]+)',  # Three word names
                r'([A-Z][a-z]+\s+[A-Z][a-z]+)',  # Two word names
            ]
            obj.institution_name_patterns = [
                r'މަޖިލިސް\s+([A-Za-z\s]+)',
                r'([A-Za-z\s]+)\s+މަޖިލިސް',
                r'Parliament\s+([A-Za-z\s]+)',
                r'([A-Za-z\s]+)\s+Parliament',
                r'([A-Z][a-z]+\s+[A-Z][a-z]+)',  # Two word institutions
            ]
            obj.save()
        return obj


class ReusableImage(models.Model):
    """Simplified model for storing reusable images with easy admin management"""
    
    ENTITY_TYPE_CHOICES = [
        ('politician', 'Politician'),
        ('institution', 'Institution'),
        ('organization', 'Organization'),
        ('public_figure', 'Public Figure'),
        ('other', 'Other'),
    ]
    
    # Core identification - Admin just needs to provide this
    entity_name = models.CharField(
        max_length=255,
        blank=True,
        help_text="Optional: Identifiable name (e.g., 'President Ibrahim Mohamed Solih'). If empty, will be generated from filename."
    )
    entity_type = models.CharField(
        max_length=50,
        choices=ENTITY_TYPE_CHOICES,
        default='other',
        help_text="Type of entity this image represents"
    )
    
    # Image management
    image_file = models.ImageField(
        upload_to='reusable_images/',
        help_text="Upload the image file"
    )
    
    # Auto-generated fields (admin doesn't need to worry about these)
    slug = models.SlugField(
        unique=True,
        help_text="Auto-generated unique identifier"
    )
    display_name = models.CharField(
        max_length=255,
        help_text="Auto-generated display name"
    )
    
    # Alternative names for matching (optional - admin can add common variations)
    alternative_names = models.TextField(
        blank=True,
        null=True,
        help_text="Optional: Alternative names separated by commas (e.g., 'Ibu Solih, President Solih, Ibrahim Solih')"
    )
    
    # Simple metadata
    description = models.TextField(
        blank=True,
        help_text="Optional description of the image"
    )
    
    # Usage tracking
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this image is available for use"
    )
    usage_count = models.PositiveIntegerField(
        default=0,
        help_text="Number of times this image has been used"
    )
    last_used = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When this image was last used"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['entity_name']
        verbose_name = 'Reusable Image'
        verbose_name_plural = 'Reusable Images'
    
    def __str__(self):
        return self.display_name
    
    def save(self, *args, **kwargs):
        # Generate entity_name from filename if not provided
        if not self.entity_name and self.image_file:
            filename = self.image_file.name
            name, ext = os.path.splitext(os.path.basename(filename))
            self.entity_name = name.replace('_', ' ').replace('-', ' ').title()
        
        if not self.slug:
            self.slug = self.generate_slug()
        if not self.display_name:
            self.display_name = self.entity_name
        super().save(*args, **kwargs)
    
    def generate_slug(self):
        """Generate simple slug from entity name"""
        from django.utils.text import slugify
        base_slug = slugify(self.entity_name)
        # Ensure uniqueness
        counter = 1
        slug = base_slug
        while ReusableImage.objects.filter(slug=slug).exclude(pk=self.pk).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        return slug
    
    def increment_usage(self):
        """Increment usage count and update last used timestamp"""
        self.usage_count += 1
        self.last_used = timezone.now()
        self.save(update_fields=['usage_count', 'last_used'])
    
    def get_all_names(self):
        """Get all possible names for this image"""
        names = [self.entity_name]
        if self.alternative_names:
            # Split by comma and clean up
            alt_names = [name.strip() for name in self.alternative_names.split(',') if name.strip()]
            names.extend(alt_names)
        return names


class ImageVerification(models.Model):
    """Model for tracking image verification requests"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('needs_revision', 'Needs Revision'),
    ]
    
    reusable_image = models.ForeignKey(
        ReusableImage,
        on_delete=models.CASCADE,
        related_name='verifications',
        help_text="The image being verified"
    )
    article = models.ForeignKey(
        Article,
        on_delete=models.CASCADE,
        related_name='image_verifications',
        help_text="The article that triggered this verification"
    )
    
    # Verification details
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        help_text="Current verification status"
    )
    confidence_score = models.FloatField(
        null=True,
        blank=True,
        help_text="Confidence score from matching algorithm (0.0 to 1.0)"
    )
    matched_name = models.CharField(
        max_length=255,
        help_text="The name that was matched in the article"
    )
    
    # Admin review
    reviewed_by = models.ForeignKey(
        'auth.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='reviewed_verifications',
        help_text="Admin user who reviewed this verification"
    )
    reviewed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When this verification was reviewed"
    )
    admin_notes = models.TextField(
        blank=True,
        help_text="Admin notes about the verification"
    )
    
    # Auto-verification settings
    auto_approved = models.BooleanField(
        default=False,
        help_text="Whether this was auto-approved by the system"
    )
    auto_approval_reason = models.CharField(
        max_length=100,
        blank=True,
        help_text="Reason for auto-approval"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Image Verification'
        verbose_name_plural = 'Image Verifications'
    
    def __str__(self):
        return f"{self.reusable_image.entity_name} - {self.article.title} ({self.status})"
    
    def approve(self, user, notes=''):
        """Approve this verification"""
        self.status = 'approved'
        self.reviewed_by = user
        self.reviewed_at = timezone.now()
        self.admin_notes = notes
        self.save()
    
    def reject(self, user, notes=''):
        """Reject this verification"""
        self.status = 'rejected'
        self.reviewed_by = user
        self.reviewed_at = timezone.now()
        self.admin_notes = notes
        self.save()
    
    def mark_needs_revision(self, user, notes=''):
        """Mark this verification as needing revision"""
        self.status = 'needs_revision'
        self.reviewed_by = user
        self.reviewed_at = timezone.now()
        self.admin_notes = notes
        self.save()