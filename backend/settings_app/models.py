from django.db import models

class SiteSettings(models.Model):
    """Site-wide settings that can be configured by admin users"""
    
    # Article settings
    default_article_status = models.CharField(
        max_length=20,
        choices=[
            ('draft', 'Draft'),
            ('published', 'Published'),
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
    
    # Content settings
    allow_comments = models.BooleanField(
        default=True,
        help_text="Whether to allow comments on articles"
    )
    
    require_comment_approval = models.BooleanField(
        default=True,
        help_text="Whether comments need admin approval before being visible"
    )
    
    # Analytics settings
    google_analytics_id = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Google Analytics tracking ID (e.g., G-XXXXXXXXXX)"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Site Settings'
        verbose_name_plural = 'Site Settings'
    
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