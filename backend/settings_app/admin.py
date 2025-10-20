from django.contrib import admin
from .models import SiteSettings

@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    list_display = ['site_name', 'default_article_status', 'allow_comments', 'require_comment_approval', 'story_cards_rows', 'story_cards_columns', 'comment_webhook_enabled', 'updated_at']
    list_editable = ['default_article_status', 'allow_comments', 'require_comment_approval', 'story_cards_rows', 'story_cards_columns', 'comment_webhook_enabled']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Article Settings', {
            'fields': ('default_article_status',)
        }),
        ('Site Information', {
            'fields': ('site_name', 'site_description', 'contact_email')
        }),
        ('Comment Settings', {
            'fields': ('allow_comments', 'require_comment_approval')
        }),
        ('Story Card Layout', {
            'fields': ('story_cards_rows', 'story_cards_columns'),
            'description': 'Configure the number of rows and columns for story cards display'
        }),
        ('Webhook Settings', {
            'fields': ('comment_webhook_enabled', 'comment_webhook_url', 'comment_webhook_secret'),
            'description': 'Configure webhook settings for approved comments'
        }),
        ('Analytics', {
            'fields': ('google_analytics_id',)
        }),
        ('Timestamps', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def has_add_permission(self, request):
        # Only allow one settings instance
        return not SiteSettings.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        # Prevent deletion of settings
        return False