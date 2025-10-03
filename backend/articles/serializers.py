from rest_framework import serializers
from .models import Article


class ArticleSerializer(serializers.ModelSerializer):
    vote_score = serializers.ReadOnlyField()
    approved_comments_count = serializers.ReadOnlyField()
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Article
        fields = [
            'id', 'title', 'slug', 'content', 'image', 'image_file', 'image_url', 'status',
            'created_at', 'updated_at', 'vote_score', 'approved_comments_count'
        ]
        read_only_fields = ['slug', 'created_at', 'updated_at']
    
    def get_image_url(self, obj):
        """Return the full image URL with fallback handling"""
        # Prioritize image_file over image URL for reliability
        if obj.image_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image_file.url)
            else:
                # Fallback for when no request context is available
                return f"http://localhost:8000{obj.image_file.url}"
        elif obj.image:
            # Only return external image URL if it's not a placeholder
            if not obj.image.startswith('https://via.placeholder.com'):
                return obj.image
            # If it's a placeholder, return None to trigger fallback
            return None
        return None


class ArticleListSerializer(serializers.ModelSerializer):
    vote_score = serializers.ReadOnlyField()
    approved_comments_count = serializers.ReadOnlyField()
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Article
        fields = [
            'id', 'title', 'slug', 'image', 'image_file', 'image_url', 'status',
            'created_at', 'vote_score', 'approved_comments_count'
        ]
        read_only_fields = ['slug', 'created_at']
    
    def get_image_url(self, obj):
        """Return the full image URL with fallback handling"""
        # Prioritize image_file over image URL for reliability
        if obj.image_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image_file.url)
            else:
                # Fallback for when no request context is available
                return f"http://localhost:8000{obj.image_file.url}"
        elif obj.image:
            # Only return external image URL if it's not a placeholder
            if not obj.image.startswith('https://via.placeholder.com'):
                return obj.image
            # If it's a placeholder, return None to trigger fallback
            return None
        return None


class ArticleIngestSerializer(serializers.ModelSerializer):
    """Serializer for n8n article ingestion"""
    image_url = serializers.URLField(write_only=True, required=False)
    
    class Meta:
        model = Article
        fields = ['title', 'content', 'image_url']
    
    def create(self, validated_data):
        # Remove image_url from validated_data as it's not a model field
        image_url = validated_data.pop('image_url', None)
        
        # Create the article
        article = Article.objects.create(**validated_data)
        
        # Handle image download if image_url is provided
        if image_url:
            # This will be handled in the view
            article.image_url = image_url
        
        return article
