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
        """Return the full image URL"""
        if obj.image:
            return obj.image
        elif obj.image_file:
            request = self.context.get('request')
            if request:
                try:
                    return request.build_absolute_uri(obj.image_file.url)
                except Exception:
                    # Fallback if build_absolute_uri fails
                    return f"https://dhivehinoos.net{obj.image_file.url}"
            else:
                # Fallback for when no request context is available
                return f"https://dhivehinoos.net{obj.image_file.url}"
        return None
