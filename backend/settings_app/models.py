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
    
    # Pagination settings
    default_pagination_size = models.PositiveIntegerField(
        default=10,
        help_text="Default number of articles to display per page (5-100)"
    )
    
    # Theme settings
    active_theme = models.CharField(
        max_length=50,
        choices=[
            ('modern', 'Modern News'),
            ('classic', 'Classic Blog'),
            ('minimal', 'Minimal Clean'),
            ('newspaper', 'Newspaper Style'),
            ('magazine', 'Magazine Layout'),
        ],
        default='modern',
        help_text="Active frontend theme/layout"
    )
    
    theme_config = models.JSONField(
        default=dict,
        blank=True,
        help_text="Custom theme configuration (colors, fonts, spacing) - stored as JSON"
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
        """Validate story card layout settings and pagination"""
        if self.story_cards_rows < 1 or self.story_cards_rows > 10:
            raise ValidationError({'story_cards_rows': 'Number of rows must be between 1 and 10'})
        
        if self.story_cards_columns < 1 or self.story_cards_columns > 6:
            raise ValidationError({'story_cards_columns': 'Number of columns must be between 1 and 6'})
        
        if self.default_pagination_size < 5 or self.default_pagination_size > 100:
            raise ValidationError({'default_pagination_size': 'Default pagination size must be between 5 and 100'})
        
        # Validate active_theme
        valid_themes = ['modern', 'classic', 'minimal', 'newspaper', 'magazine']
        if self.active_theme not in valid_themes:
            raise ValidationError({'active_theme': f'Theme must be one of: {", ".join(valid_themes)}'})
        
        # Validate theme_config is a dict (JSONField handles this, but we can add custom validation)
        if self.theme_config and not isinstance(self.theme_config, dict):
            raise ValidationError({'theme_config': 'Theme configuration must be a valid JSON object'})
    
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
            'default_pagination_size': 10,
            'active_theme': 'modern',
            'theme_config': {},
        }
        )
        return settings