from django.db import models
from django.core.exceptions import ValidationError

class SiteSettings(models.Model):
    """Site-wide settings that can be configured by admin users"""
    
    # Article settings
    default_article_status = models.CharField(
        max_length=20,
        choices=[
            ('draft', 'Draft'),
            ('published', 'Published'),
            ('scheduled', 'Scheduled'),
        ],
        default='draft',
        help_text="Default status for new articles created via API"
    )
    
    # Site information
    site_name = models.CharField(max_length=255, default='Dhivehinoos.net')
    site_description = models.TextField(
        default='Authentic Maldivian Dhivehi Twitter thoughts and cultural insights for the Maldivian diaspora worldwide. Connect with your roots through curated Dhivehi content.',
        help_text="Site description for SEO and about pages"
    )
    contact_email = models.EmailField(
        default='emaildym@proton.me',
        help_text="Main contact email address for the website"
    )
    
    # Content settings
    allow_comments = models.BooleanField(
        default=True,
        help_text="Whether to allow comments on articles"
    )
    
    require_comment_approval = models.BooleanField(
        default=True,
        help_text="Whether comments need admin approval before being visible"
    )
    
    # Image matching settings
    enable_image_matching = models.BooleanField(
        default=True,
        help_text="Whether to automatically match articles with reusable images of prominent people and institutions"
    )
    
    # Story card layout settings
    story_cards_rows = models.PositiveIntegerField(
        default=3,
        help_text="Number of rows to display story cards (1-10)"
    )
    
    story_cards_columns = models.PositiveIntegerField(
        default=3,
        help_text="Number of columns to display story cards (1-6)"
    )
    
    # Analytics settings
    google_analytics_id = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Google Analytics tracking ID (e.g., G-XXXXXXXXXX)"
    )
    
    # Webhook settings
    comment_webhook_url = models.URLField(
        blank=True,
        null=True,
        help_text="Webhook URL to send approved comments to (e.g., n8n workflow URL)"
    )
    
    comment_webhook_enabled = models.BooleanField(
        default=False,
        help_text="Whether to send approved comments to webhook"
    )
    
    comment_webhook_secret = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Secret key for webhook authentication (optional)"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Site Settings'
        verbose_name_plural = 'Site Settings'
    
    def clean(self):
        """Validate story card layout settings"""
        if self.story_cards_rows < 1 or self.story_cards_rows > 10:
            raise ValidationError({'story_cards_rows': 'Number of rows must be between 1 and 10'})
        
        if self.story_cards_columns < 1 or self.story_cards_columns > 6:
            raise ValidationError({'story_cards_columns': 'Number of columns must be between 1 and 6'})
    
    def __str__(self):
        return f'Site Settings (Updated: {self.updated_at.strftime("%Y-%m-%d %H:%M")})'
    
    @classmethod
    def get_settings(cls):
        """Get the current site settings, creating default if none exist"""
        settings, created = cls.objects.get_or_create(
            pk=1,
        defaults={
            'default_article_status': 'draft',
            'site_name': 'Dhivehinoos.net',
            'site_description': 'Authentic Maldivian Dhivehi Twitter thoughts and cultural insights for the Maldivian diaspora worldwide. Connect with your roots through curated Dhivehi content.',
            'allow_comments': True,
            'require_comment_approval': True,
        }
        )
        return settings