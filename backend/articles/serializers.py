from rest_framework import serializers
from .models import Article, Category


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category model"""
    articles_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'color', 'icon', 'is_active', 'sort_order', 'articles_count']
        read_only_fields = ['slug']
    
    def get_articles_count(self, obj):
        """Return count of published articles in this category"""
        return obj.articles.filter(status='published').count()


class ArticleSerializer(serializers.ModelSerializer):
    vote_score = serializers.ReadOnlyField()
    approved_comments_count = serializers.ReadOnlyField()
    image_url = serializers.SerializerMethodField()
    category = CategorySerializer(read_only=True)
    category_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = Article
        fields = [
            'id', 'title', 'slug', 'content', 'image', 'image_file', 'image_url', 'status',
            'category', 'category_id', 'created_at', 'updated_at', 'vote_score', 'approved_comments_count'
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
    category = CategorySerializer(read_only=True)
    
    class Meta:
        model = Article
        fields = [
            'id', 'title', 'slug', 'image', 'image_file', 'image_url', 'status',
            'category', 'created_at', 'vote_score', 'approved_comments_count'
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
    category_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = Article
        fields = ['title', 'content', 'image_url', 'category_id']
    
    def create(self, validated_data):
        # Remove image_url and category_id from validated_data as they're not model fields
        image_url = validated_data.pop('image_url', None)
        category_id = validated_data.pop('category_id', None)
        
        # Get default status from site settings
        from settings_app.models import SiteSettings
        settings = SiteSettings.get_settings()
        default_status = settings.default_article_status
        
        # Create the article with the configured default status
        article = Article.objects.create(
            **validated_data,
            status=default_status
        )
        
        # Set category if provided
        if category_id:
            try:
                from .models import Category
                category = Category.objects.get(id=category_id, is_active=True)
                article.category = category
                article.save()
            except Category.DoesNotExist:
                pass  # Auto-categorization will handle this
        
        # Store image_url in the article instance for the view to use
        if image_url:
            article._image_url = image_url
        
        return article
