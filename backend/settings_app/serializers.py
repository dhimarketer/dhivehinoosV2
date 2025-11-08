from rest_framework import serializers
from .models import SiteSettings
import re

class SiteSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSettings
        fields = [
            'id',
            'default_article_status',
            'site_name',
            'site_description',
            'contact_email',
            'allow_comments',
            'require_comment_approval',
            'story_cards_rows',
            'story_cards_columns',
            'default_pagination_size',
            'active_theme',
            'theme_config',
            'google_analytics_id',
            'comment_webhook_url',
            'comment_webhook_enabled',
            'comment_webhook_secret',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_default_article_status(self, value):
        """Validate that the status is a valid choice"""
        valid_choices = ['draft', 'published', 'scheduled']
        if value not in valid_choices:
            raise serializers.ValidationError(f"Status must be one of: {', '.join(valid_choices)}")
        return value
    
    def validate_google_analytics_id(self, value):
        """Validate Google Analytics ID format"""
        if not value:  # Allow empty/null values
            return value
        
        # GA4 format: G-XXXXXXXXXX or G-XXXXXXXXX
        ga4_pattern = r'^G-[A-Z0-9]{8,10}$'
        if not re.match(ga4_pattern, value):
            raise serializers.ValidationError(
                "Google Analytics ID must be in GA4 format (e.g., G-XXXXXXXXXX)"
            )
        return value
    
    def validate_story_cards_rows(self, value):
        """Validate story cards rows"""
        if value < 1 or value > 10:
            raise serializers.ValidationError("Number of rows must be between 1 and 10")
        return value
    
    def validate_story_cards_columns(self, value):
        """Validate story cards columns"""
        if value < 1 or value > 6:
            raise serializers.ValidationError("Number of columns must be between 1 and 6")
        return value
    
    def validate_default_pagination_size(self, value):
        """Validate default pagination size"""
        if value < 5 or value > 100:
            raise serializers.ValidationError("Default pagination size must be between 5 and 100")
        return value
    
    def validate_active_theme(self, value):
        """Validate active theme"""
        valid_themes = ['modern', 'classic', 'minimal', 'newspaper', 'magazine']
        if value not in valid_themes:
            raise serializers.ValidationError(f"Theme must be one of: {', '.join(valid_themes)}")
        return value
    
    def validate_theme_config(self, value):
        """Validate theme_config is a dict"""
        if value and not isinstance(value, dict):
            raise serializers.ValidationError("Theme configuration must be a valid JSON object")
        return value
    
    def validate_comment_webhook_url(self, value):
        """Validate webhook URL format"""
        if not value:  # Allow empty/null values
            return value
        
        # Basic URL validation - should start with http:// or https://
        if not value.startswith(('http://', 'https://')):
            raise serializers.ValidationError(
                "Webhook URL must start with http:// or https://"
            )
        
        # Check for common webhook URL patterns
        if 'n8n' in value.lower() or 'webhook' in value.lower() or 'api' in value.lower():
            return value
        
        # Allow any valid URL format
        return value
    
    def validate(self, data):
        """Cross-field validation"""
        # If webhook is enabled, URL should be provided
        if data.get('comment_webhook_enabled') and not data.get('comment_webhook_url'):
            raise serializers.ValidationError({
                'comment_webhook_url': 'Webhook URL is required when webhook is enabled'
            })
        
        return data
