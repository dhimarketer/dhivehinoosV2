from django.contrib import admin
from .models import SiteSettings

@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    list_display = ['site_name', 'default_article_status', 'allow_comments', 'require_comment_approval', 'updated_at']
    list_editable = ['default_article_status', 'allow_comments', 'require_comment_approval']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Article Settings', {
            'fields': ('default_article_status',)
        }),
        ('Site Information', {
            'fields': ('site_name', 'site_description')
        }),
        ('Comment Settings', {
            'fields': ('allow_comments', 'require_comment_approval')
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