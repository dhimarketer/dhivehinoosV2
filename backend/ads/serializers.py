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
        source='placement'
    )
    
    class Meta:
        model = Ad
        fields = [
            'id', 'title', 'image', 'image_file', 'image_url', 'destination_url', 
            'placement', 'placement_id', 'is_active', 'start_date', 'end_date', 'created_at'
        ]
        read_only_fields = ['created_at']
    
    def get_image_url(self, obj):
        """Return the full image URL"""
        if obj.image:
            return obj.image
        elif obj.image_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image_file.url)
            else:
                # Fallback for when no request context is available
                return f"http://localhost:8000{obj.image_file.url}"
        return None
