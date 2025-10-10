from rest_framework import serializers
from .models import Article, Category, PublishingSchedule, ScheduledArticle


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
    publishing_mode = serializers.ChoiceField(
        choices=[('instant', 'Instant'), ('scheduled', 'Scheduled')],
        default='instant',
        write_only=True,
        required=False
    )
    scheduled_publish_time = serializers.DateTimeField(write_only=True, required=False)
    schedule_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = Article
        fields = ['title', 'content', 'image_url', 'category_id', 'publishing_mode', 'scheduled_publish_time', 'schedule_id']
    
    def create(self, validated_data):
        # Remove fields that are not model fields
        image_url = validated_data.pop('image_url', None)
        category_id = validated_data.pop('category_id', None)
        publishing_mode = validated_data.pop('publishing_mode', 'instant')
        scheduled_publish_time = validated_data.pop('scheduled_publish_time', None)
        schedule_id = validated_data.pop('schedule_id', None)
        
        # Get default status from site settings
        from settings_app.models import SiteSettings
        settings = SiteSettings.get_settings()
        default_status = settings.default_article_status
        
        # Create the article with the configured default status
        article = Article.objects.create(
            **validated_data,
            status=default_status,
            publishing_mode=publishing_mode,
            scheduled_publish_time=scheduled_publish_time
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
        
        # Handle scheduling if requested or if default status is 'scheduled'
        if publishing_mode == 'scheduled' or default_status == 'scheduled':
            try:
                from .scheduling_service import ArticleSchedulingService
                schedule = None
                
                if schedule_id:
                    try:
                        from .models import PublishingSchedule
                        schedule = PublishingSchedule.objects.get(id=schedule_id, is_active=True)
                    except PublishingSchedule.DoesNotExist:
                        pass
                
                ArticleSchedulingService.schedule_article(
                    article, 
                    schedule=schedule, 
                    custom_time=scheduled_publish_time
                )
            except Exception as e:
                # Don't fail article creation if scheduling fails
                print(f"Scheduling failed: {e}")
                # Fallback to draft status if scheduling fails
                article.status = 'draft'
                article.save()
        
        # Store image_url in the article instance for the view to use
        if image_url:
            article._image_url = image_url
        
        return article


class PublishingScheduleSerializer(serializers.ModelSerializer):
    """Serializer for PublishingSchedule model"""
    interval_minutes = serializers.SerializerMethodField()
    
    class Meta:
        model = PublishingSchedule
        fields = [
            'id', 'name', 'is_active', 'frequency', 'custom_interval_minutes',
            'interval_minutes', 'forbidden_hours_start', 'forbidden_hours_end',
            'max_articles_per_day', 'queue_priority', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_interval_minutes(self, obj):
        """Return the interval in minutes"""
        return obj.get_interval_minutes()


class ScheduledArticleSerializer(serializers.ModelSerializer):
    """Serializer for ScheduledArticle model"""
    article = serializers.SerializerMethodField()
    schedule = PublishingScheduleSerializer(read_only=True)
    can_publish_now = serializers.SerializerMethodField()
    
    class Meta:
        model = ScheduledArticle
        fields = [
            'id', 'article', 'schedule', 'status', 'scheduled_publish_time',
            'priority', 'can_publish_now', 'created_at', 'updated_at',
            'published_at', 'failure_reason'
        ]
        read_only_fields = ['created_at', 'updated_at', 'published_at']
    
    def get_article(self, obj):
        """Return basic article information"""
        return {
            'id': obj.article.id,
            'title': obj.article.title,
            'slug': obj.article.slug,
            'status': obj.article.status
        }
    
    def get_can_publish_now(self, obj):
        """Return whether this article can be published now"""
        return obj.can_publish_now()


class ArticleSerializer(serializers.ModelSerializer):
    vote_score = serializers.ReadOnlyField()
    approved_comments_count = serializers.ReadOnlyField()
    image_url = serializers.SerializerMethodField()
    category = CategorySerializer(read_only=True)
    category_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    scheduled_publish_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Article
        fields = [
            'id', 'title', 'slug', 'content', 'image', 'image_file', 'image_url', 'status',
            'category', 'category_id', 'publishing_mode', 'scheduled_publish_time',
            'scheduled_publish_info', 'created_at', 'updated_at', 'vote_score', 'approved_comments_count'
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
    
    def get_scheduled_publish_info(self, obj):
        """Return scheduling information if article is scheduled"""
        if hasattr(obj, 'scheduled_publish') and obj.scheduled_publish:
            return ScheduledArticleSerializer(obj.scheduled_publish).data
        return None
