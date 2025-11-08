from django.contrib import admin
from django.utils.html import format_html
from django import forms
from .models import SiteSettings


class SiteSettingsAdminForm(forms.ModelForm):
    """Custom form for SiteSettings admin with enhanced theme selection"""
    
    class Meta:
        model = SiteSettings
        fields = '__all__'
        widgets = {
            'active_theme': forms.Select(attrs={
                'style': 'width: 300px; padding: 8px; font-size: 14px;',
                'onchange': 'updateThemeDescription(this.value)'
            }),
            'theme_config': forms.Textarea(attrs={
                'rows': 10,
                'cols': 80,
                'style': 'font-family: monospace; font-size: 12px;',
                'placeholder': '{"colors": {"brand": {"500": "#0073e6"}}, "fonts": {"heading": "Inter"}, "space": {"4": "1rem"}}'
            }),
        }
        help_texts = {
            'active_theme': 'Select the frontend theme/layout for your site. Changes take effect immediately after saving.',
            'theme_config': 'Optional JSON configuration for custom theme overrides. Leave empty to use default theme settings.',
        }


@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    form = SiteSettingsAdminForm
    list_display = ['site_name', 'default_article_status', 'allow_comments', 'require_comment_approval', 'enable_image_matching', 'story_cards_rows', 'story_cards_columns', 'default_pagination_size', 'active_theme', 'comment_webhook_enabled', 'updated_at']
    list_editable = ['default_article_status', 'allow_comments', 'require_comment_approval', 'enable_image_matching', 'story_cards_rows', 'story_cards_columns', 'default_pagination_size', 'active_theme', 'comment_webhook_enabled']
    readonly_fields = ['id', 'created_at', 'updated_at', 'theme_preview']
    
    fieldsets = (
        ('🎨 Theme & Layout Settings', {
            'fields': ('active_theme', 'theme_preview', 'theme_config'),
            'description': format_html(
                '<div style="background: #f0f7ff; padding: 15px; border-left: 4px solid #0073e6; margin: 10px 0;">'
                '<h3 style="margin-top: 0; color: #0073e6;">Frontend Theme Selection</h3>'
                '<p><strong>Select a theme to change the entire look and layout of your website:</strong></p>'
                '<ul style="margin: 10px 0; padding-left: 20px;">'
                '<li><strong>Modern News:</strong> Clean, modern design with featured article and grid layout (current default)</li>'
                '<li><strong>Classic Blog:</strong> Traditional blog layout with sidebar, warm colors, serif fonts</li>'
                '<li><strong>Minimal Clean:</strong> Minimalist design with lots of whitespace, simple typography</li>'
                '<li><strong>Newspaper Style:</strong> Traditional newspaper layout with multi-column grid, black/white/gray</li>'
                '<li><strong>Magazine Layout:</strong> Bold, visual design with large featured images, asymmetric layouts</li>'
                '</ul>'
                '<p style="margin-bottom: 0;"><em>Theme changes take effect immediately after saving. You can preview by visiting the homepage.</em></p>'
                '</div>'
            ),
            'classes': ('wide',),
        }),
        ('Article Settings', {
            'fields': ('default_article_status', 'enable_image_matching'),
            'description': 'Configure default article behavior and image matching settings'
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
        ('Pagination Settings', {
            'fields': ('default_pagination_size',),
            'description': 'Configure the default number of articles to display per page on the main page'
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
    
    def theme_preview(self, obj):
        """Display theme information and preview"""
        if not obj:
            return "Save settings to see theme preview"
        
        theme_descriptions = {
            'modern': {
                'name': 'Modern News',
                'description': 'Clean, modern design with featured article and grid layout',
                'color': '#0073e6',
                'icon': '📰'
            },
            'classic': {
                'name': 'Classic Blog',
                'description': 'Traditional blog layout with sidebar, warm colors, serif fonts',
                'color': '#f08c2c',
                'icon': '📖'
            },
            'minimal': {
                'name': 'Minimal Clean',
                'description': 'Minimalist design with lots of whitespace, simple typography',
                'color': '#505050',
                'icon': '✨'
            },
            'newspaper': {
                'name': 'Newspaper Style',
                'description': 'Traditional newspaper layout with multi-column grid',
                'color': '#424242',
                'icon': '📰'
            },
            'magazine': {
                'name': 'Magazine Layout',
                'description': 'Bold, visual design with large featured images, asymmetric layouts',
                'color': '#e53e3e',
                'icon': '📸'
            },
        }
        
        theme = obj.active_theme or 'modern'
        info = theme_descriptions.get(theme, theme_descriptions['modern'])
        
        return format_html(
            '<div style="background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid {};">'
            '<h4 style="margin: 0 0 10px 0; color: {};">{} {}</h4>'
            '<p style="margin: 0; color: #666;">{}</p>'
            '<p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">'
            'Current active theme. Change using the dropdown above and save to apply.'
            '</p>'
            '</div>',
            info['color'],
            info['color'],
            info['icon'],
            info['name'],
            info['description']
        )
    theme_preview.short_description = 'Current Theme Preview'
    
    def has_add_permission(self, request):
        # Only allow one settings instance
        return not SiteSettings.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        # Prevent deletion of settings
        return False