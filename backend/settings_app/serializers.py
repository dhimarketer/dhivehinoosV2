from rest_framework import serializers
from .models import SiteSettings

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
