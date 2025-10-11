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


# Removed duplicate ArticleSerializer - using the one below with scheduling fields


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
    
    def validate(self, data):
        """Custom validation for schedule data"""
        errors = {}
        
        # Validate custom_interval_minutes when frequency is 'custom'
        if data.get('frequency') == 'custom':
            if not data.get('custom_interval_minutes'):
                errors['custom_interval_minutes'] = 'Custom interval minutes is required when frequency is custom'
            elif data.get('custom_interval_minutes') < 1 or data.get('custom_interval_minutes') > 10080:
                errors['custom_interval_minutes'] = 'Custom interval must be between 1 and 10080 minutes'
        else:
            # Clear custom_interval_minutes for non-custom frequencies
            if 'custom_interval_minutes' in data:
                data['custom_interval_minutes'] = None
        
        # Validate forbidden hours
        forbidden_start = data.get('forbidden_hours_start')
        forbidden_end = data.get('forbidden_hours_end')
        
        if forbidden_start and forbidden_end:
            if forbidden_start == forbidden_end:
                errors['forbidden_hours_end'] = 'Forbidden hours start and end cannot be the same'
        
        # Validate max_articles_per_day
        max_articles = data.get('max_articles_per_day')
        if max_articles is not None and (max_articles < 1 or max_articles > 100):
            errors['max_articles_per_day'] = 'Max articles per day must be between 1 and 100'
        
        # Validate queue_priority
        priority = data.get('queue_priority')
        if priority is not None and priority < 0:
            errors['queue_priority'] = 'Queue priority must be a positive number'
        
        if errors:
            raise serializers.ValidationError(errors)
        
        return data
    
    def validate_name(self, value):
        """Validate schedule name"""
        if not value or not value.strip():
            raise serializers.ValidationError('Schedule name cannot be empty')
        
        # Check for uniqueness (excluding current instance for updates)
        instance = self.instance
        if instance:
            if PublishingSchedule.objects.filter(name=value).exclude(id=instance.id).exists():
                raise serializers.ValidationError('A schedule with this name already exists')
        else:
            if PublishingSchedule.objects.filter(name=value).exists():
                raise serializers.ValidationError('A schedule with this name already exists')
        
        return value.strip()
    
    def validate_frequency(self, value):
        """Validate frequency choice"""
        valid_choices = [choice[0] for choice in PublishingSchedule.FREQUENCY_CHOICES]
        if value not in valid_choices:
            raise serializers.ValidationError(f'Invalid frequency. Must be one of: {", ".join(valid_choices)}')
        return value


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
    
    def update(self, instance, validated_data):
        """Custom update method to handle image updates properly"""
        # Handle category_id separately
        category_id = validated_data.pop('category_id', None)
        if category_id is not None:
            try:
                from .models import Category
                instance.category = Category.objects.get(id=category_id)
            except Category.DoesNotExist:
                pass  # Keep existing category if new one doesn't exist
        
        # Special handling for published articles
        # If article is published and no status is provided, keep it published
        if instance.status == 'published' and 'status' not in validated_data:
            # Don't change the status - keep it published
            pass
        elif instance.status == 'published' and validated_data.get('status') == 'draft':
            # If admin explicitly wants to unpublish, allow it
            pass
        
        # Update all other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Save the instance
        instance.save()
        
        return instance
