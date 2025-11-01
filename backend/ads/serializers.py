from rest_framework import serializers
from .models import Ad, AdPlacement


class AdPlacementSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdPlacement
        fields = ['id', 'name', 'description', 'is_active', 'max_ads', 'created_at']
        read_only_fields = ['created_at']


class AdSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    placement = AdPlacementSerializer(read_only=True)
    placement_id = serializers.PrimaryKeyRelatedField(
        queryset=AdPlacement.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
        source='placement'
    )
    start_date = serializers.DateTimeField(required=False, allow_null=True)
    end_date = serializers.DateTimeField(required=False, allow_null=True)
    
    def to_internal_value(self, data):
        # Handle empty string for placement_id
        if 'placement_id' in data and data['placement_id'] == '':
            data = data.copy()
            data['placement_id'] = None
        
        # Handle date fields - convert empty strings to None
        if 'start_date' in data and data['start_date'] == '':
            data = data.copy()
            data['start_date'] = None
        if 'end_date' in data and data['end_date'] == '':
            data = data.copy()
            data['end_date'] = None
            
        return super().to_internal_value(data)
    
    def update(self, instance, validated_data):
        # If placement_id is not provided in the data, set placement to None
        if 'placement' not in validated_data and 'placement_id' not in self.initial_data:
            validated_data['placement'] = None
        return super().update(instance, validated_data)
    
    class Meta:
        model = Ad
        fields = [
            'id', 'title', 'image', 'image_file', 'image_url', 'destination_url', 
            'placement', 'placement_id', 'is_active', 'start_date', 'end_date', 'created_at'
        ]
        read_only_fields = ['created_at']
    
    def get_image_url(self, obj):
        """Return the full image URL, ensuring HTTPS in production"""
        from django.conf import settings
        
        # Helper function to ensure HTTPS URLs in production
        def ensure_https_url(url):
            if not url:
                return url
            # If it's already an external HTTPS URL, return as-is
            if url.startswith('https://'):
                return url
            # If it's HTTP, convert to HTTPS in production
            if url.startswith('http://'):
                return url.replace('http://', 'https://') if not settings.DEBUG else url
            # If it's a relative URL, construct absolute URL with HTTPS in production
            if url.startswith('/'):
                protocol = 'https' if not settings.DEBUG else 'http'
                return f"{protocol}://dhivehinoos.net{url}"
            return url
        
        if obj.image:
            return ensure_https_url(obj.image)
        elif obj.image_file:
            request = self.context.get('request')
            if request:
                try:
                    url = request.build_absolute_uri(obj.image_file.url)
                    return ensure_https_url(url)
                except Exception:
                    # Fallback if build_absolute_uri fails
                    return f"https://dhivehinoos.net{obj.image_file.url}"
            else:
                # Fallback for when no request context is available
                return f"https://dhivehinoos.net{obj.image_file.url}"
        return None
