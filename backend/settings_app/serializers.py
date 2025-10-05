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
            'allow_comments',
            'require_comment_approval',
            'google_analytics_id',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_default_article_status(self, value):
        """Validate that the status is a valid choice"""
        valid_choices = ['draft', 'published']
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
