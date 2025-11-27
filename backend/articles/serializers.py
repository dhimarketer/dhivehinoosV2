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
    reuse_images = serializers.SerializerMethodField()
    reused_image_url = serializers.SerializerMethodField()
    category = CategorySerializer(read_only=True)
    
    class Meta:
        model = Article
        fields = [
            'id', 'title', 'slug', 'content', 'source_fragments', 'image', 'image_file', 'image_url', 
            'reuse_images', 'reused_image_url', 'status',
            'category', 'created_at', 'vote_score', 'approved_comments_count'
        ]
        read_only_fields = ['slug', 'created_at']
    
    def get_image_url(self, obj):
        """Prioritize Docker volume images first, then fallback to external URLs - optimized version with Redis caching"""
        from django.conf import settings
        from .cache_utils import get_cached_article_data, cache_article_data
        
        # Check Redis cache first - use versioned cache key to ensure cache refresh after priority change
        cache_key = f'article:image_url:v2:{obj.id}'
        cached_url = get_cached_article_data(cache_key)
        if cached_url:
            return cached_url
        
        # Cache settings check
        _is_production = not settings.DEBUG
        _base_url = 'https://dhivehinoos.net' if _is_production else 'http://dhivehinoos.net'
        
        # Helper function to ensure HTTPS URLs in production
        def ensure_https_url(url):
            if not url:
                return url
            if url.startswith('https://'):
                return url
            if url.startswith('http://'):
                return url.replace('http://', 'https://') if _is_production else url
            if url.startswith('/'):
                return f"{_base_url}{url}"
            return url
        
        # PRIORITY 1: Docker volume image_file (served from local storage - fastest)
        # This is for explicitly uploaded images, highest priority
        if obj.image_file and obj.image_file.name:
            try:
                request = self.context.get('request')
                if request:
                    url = request.build_absolute_uri(obj.image_file.url)
                else:
                    url = f"{_base_url}{obj.image_file.url}"
                final_url = ensure_https_url(url)
                # Cache for 1 hour (3600 seconds)
                cache_article_data(cache_key, final_url, timeout=3600)
                return final_url
            except Exception:
                pass  # Silently fail to avoid performance impact
        
        # PRIORITY 2: External API image URL (original story image - should be shown on landing page)
        # Prioritize API image over reusable images for landing page display
        # But validate that the URL is not empty or just whitespace
        if obj.image and isinstance(obj.image, str):
            image_url_clean = obj.image.strip()
            # Only proceed if the cleaned URL is not empty and is a valid URL format
            if (image_url_clean and 
                len(image_url_clean) > 0 and
                not image_url_clean.startswith('https://via.placeholder.com') and
                (image_url_clean.startswith('http://') or image_url_clean.startswith('https://') or image_url_clean.startswith('/'))):
                try:
                    final_url = ensure_https_url(image_url_clean)
                    # Cache external URLs for shorter time (15 minutes) as they might change
                    cache_article_data(cache_key, final_url, timeout=900)
                    return final_url
                except Exception:
                    # If URL processing fails, continue to fallback options
                    pass
        
        # PRIORITY 3: Reusable image from Docker volume (fallback if no valid API image)
        # Use reusable images if API image is missing or invalid
        # First try the primary reused_image
        if obj.reused_image and obj.reused_image.image_file and obj.reused_image.image_file.name:
            try:
                request = self.context.get('request')
                if request:
                    url = request.build_absolute_uri(obj.reused_image.image_file.url)
                else:
                    url = f"{_base_url}{obj.reused_image.image_file.url}"
                final_url = ensure_https_url(url)
                # Cache for 1 hour
                cache_article_data(cache_key, final_url, timeout=3600)
                return final_url
            except Exception:
                pass  # Silently fail to avoid performance impact
        
        # PRIORITY 4: Try first reuse image from reuse_images many-to-many if reused_image failed
        # This ensures we always return an image if one exists in the library
        if obj.reuse_images.exists():
            for reuse_image in obj.reuse_images.all()[:1]:  # Just get the first one
                if reuse_image.image_file and reuse_image.image_file.name:
                    try:
                        request = self.context.get('request')
                        if request:
                            url = request.build_absolute_uri(reuse_image.image_file.url)
                        else:
                            url = f"{_base_url}{reuse_image.image_file.url}"
                        final_url = ensure_https_url(url)
                        # Cache for 1 hour
                        cache_article_data(cache_key, final_url, timeout=3600)
                        return final_url
                    except Exception:
                        continue  # Try next image if this one fails
        
        return None
    
    def get_reused_image_url(self, obj):
        """Return the URL of the primary reused image if available and exists"""
        if obj.reused_image and obj.reused_image.image_file:
            try:
                if obj.reused_image.image_file.name and obj.reused_image.image_file.storage.exists(obj.reused_image.image_file.name):
                    request = self.context.get('request')
                    if request:
                        return request.build_absolute_uri(obj.reused_image.image_file.url)
                    else:
                        from django.conf import settings
                        protocol = 'https' if not settings.DEBUG else 'http'
                        return f"{protocol}://dhivehinoos.net{obj.reused_image.image_file.url}"
            except Exception as e:
                print(f"⚠️  Warning: Error accessing reused image file: {e}")
        return None
    
    def get_reuse_images(self, obj):
        """Return all reuse images with their URLs and metadata"""
        reuse_images = []
        for image in obj.reuse_images.all():
            if image.image_file and image.image_file.name and image.image_file.storage.exists(image.image_file.name):
                try:
                    request = self.context.get('request')
                    if request:
                        image_url = request.build_absolute_uri(image.image_file.url)
                    else:
                        from django.conf import settings
                        protocol = 'https' if not settings.DEBUG else 'http'
                        image_url = f"{protocol}://dhivehinoos.net{image.image_file.url}"
                    
                    reuse_images.append({
                        'id': image.id,
                        'entity_name': image.entity_name,
                        'entity_type': image.entity_type,
                        'image_url': image_url,
                        'description': image.description,
                        'usage_count': image.usage_count
                    })
                except Exception as e:
                    print(f"⚠️  Warning: Error accessing reuse image {image.id}: {e}")
        return reuse_images


class ArticleIngestSerializer(serializers.ModelSerializer):
    """Serializer for n8n article ingestion"""
    # Support both n8n format and direct format
    headline = serializers.CharField(write_only=True, required=False, help_text="n8n format: article headline")
    main_post = serializers.CharField(write_only=True, required=False, help_text="n8n format: article content")
    synopsis = serializers.CharField(write_only=True, required=False, help_text="n8n format: article synopsis")
    
    # Direct format fields
    title = serializers.CharField(required=False, help_text="Direct format: article title")
    content = serializers.CharField(required=False, help_text="Direct format: article content")
    
    # Common fields
    image_url = serializers.URLField(write_only=True, required=False)
    proposed_url = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=500)
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
        fields = ['title', 'content', 'headline', 'main_post', 'synopsis', 'image_url', 'proposed_url', 'category_id', 'publishing_mode', 'scheduled_publish_time', 'schedule_id']
    
    def create(self, validated_data):
        # Handle field mapping from n8n format to model format
        headline = validated_data.pop('headline', None)
        main_post = validated_data.pop('main_post', None)
        synopsis = validated_data.pop('synopsis', None)
        
        # Map n8n fields to model fields
        if headline and not validated_data.get('title'):
            validated_data['title'] = headline
        if main_post and not validated_data.get('content'):
            validated_data['content'] = main_post
        
        # Ensure required fields are present
        if not validated_data.get('title'):
            raise serializers.ValidationError({'title': 'This field is required (or provide headline)'})
        if not validated_data.get('content'):
            raise serializers.ValidationError({'content': 'This field is required (or provide main_post)'})
        
        # Remove fields that are not model fields
        image_url = validated_data.pop('image_url', None)
        proposed_url = validated_data.pop('proposed_url', None)
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
            proposed_url=proposed_url,
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
            # Also store the original API image URL in the database
            article.image = image_url
            article.image_source = 'external'
            article.save()
        
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
    reused_image_url = serializers.SerializerMethodField()
    reuse_images = serializers.SerializerMethodField()
    original_image_url = serializers.SerializerMethodField()
    article_url = serializers.ReadOnlyField()
    category = CategorySerializer(read_only=True)
    category_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    scheduled_publish_info = serializers.SerializerMethodField()
    social_metadata = serializers.SerializerMethodField()
    identified_entities = serializers.SerializerMethodField()
    
    class Meta:
        model = Article
        fields = [
            'id', 'title', 'slug', 'proposed_url', 'article_url', 'content', 'source_fragments', 'image', 'image_file', 
            'image_url', 'reused_image_url', 'reuse_images', 'original_image_url', 'status',
            'category', 'category_id', 'publishing_mode', 'scheduled_publish_time',
            'scheduled_publish_info', 'social_metadata', 'identified_entities', 'created_at', 'updated_at', 'vote_score', 'approved_comments_count'
        ]
        read_only_fields = ['slug', 'created_at', 'updated_at']
    
    def get_image_url(self, obj):
        """Prioritize Docker volume images first, then fallback to external URLs - optimized version with Redis caching"""
        from django.conf import settings
        from .cache_utils import get_cached_article_data, cache_article_data
        
        # Cache settings check (only done once per serializer instance)
        _is_production = not settings.DEBUG
        _base_url = 'https://dhivehinoos.net' if _is_production else 'http://dhivehinoos.net'
        
        # Check Redis cache first
        # Use versioned cache key to ensure cache refresh after priority change (v2: API image prioritized over reusable)
        cache_key = f'article:image_url:v2:{obj.id}'
        cached_url = get_cached_article_data(cache_key)
        if cached_url:
            return cached_url
        
        # Helper function to ensure HTTPS URLs in production
        def ensure_https_url(url):
            if not url:
                return url
            if url.startswith('https://'):
                return url
            if url.startswith('http://'):
                return url.replace('http://', 'https://') if _is_production else url
            if url.startswith('/'):
                return f"{_base_url}{url}"
            return url
        
        # PRIORITY 1: Docker volume image_file (served from local storage - fastest)
        # This is for explicitly uploaded images, highest priority
        if obj.image_file and obj.image_file.name:
            try:
                request = self.context.get('request')
                if request:
                    url = request.build_absolute_uri(obj.image_file.url)
                else:
                    url = f"{_base_url}{obj.image_file.url}"
                final_url = ensure_https_url(url)
                # Cache for 1 hour (3600 seconds)
                cache_article_data(cache_key, final_url, timeout=3600)
                return final_url
            except Exception:
                pass  # Silently fail to avoid performance impact
        
        # PRIORITY 2: External API image URL (original story image - should be shown on landing page)
        # Prioritize API image over reusable images for landing page display
        # But validate that the URL is not empty or just whitespace
        if obj.image and isinstance(obj.image, str):
            image_url_clean = obj.image.strip()
            # Only proceed if the cleaned URL is not empty and is a valid URL format
            if (image_url_clean and 
                len(image_url_clean) > 0 and
                not image_url_clean.startswith('https://via.placeholder.com') and
                (image_url_clean.startswith('http://') or image_url_clean.startswith('https://') or image_url_clean.startswith('/'))):
                try:
                    final_url = ensure_https_url(image_url_clean)
                    # Cache external URLs for shorter time (15 minutes) as they might change
                    cache_article_data(cache_key, final_url, timeout=900)
                    return final_url
                except Exception:
                    # If URL processing fails, continue to fallback options
                    pass
        
        # PRIORITY 3: Reusable image from Docker volume (fallback if no valid API image)
        # Use reusable images if API image is missing or invalid
        # First try the primary reused_image
        if obj.reused_image and obj.reused_image.image_file and obj.reused_image.image_file.name:
            try:
                request = self.context.get('request')
                if request:
                    url = request.build_absolute_uri(obj.reused_image.image_file.url)
                else:
                    url = f"{_base_url}{obj.reused_image.image_file.url}"
                final_url = ensure_https_url(url)
                # Cache for 1 hour
                cache_article_data(cache_key, final_url, timeout=3600)
                return final_url
            except Exception:
                pass  # Silently fail to avoid performance impact
        
        # PRIORITY 4: Try first reuse image from reuse_images many-to-many if reused_image failed
        # This ensures we always return an image if one exists in the library
        if obj.reuse_images.exists():
            for reuse_image in obj.reuse_images.all()[:1]:  # Just get the first one
                if reuse_image.image_file and reuse_image.image_file.name:
                    try:
                        request = self.context.get('request')
                        if request:
                            url = request.build_absolute_uri(reuse_image.image_file.url)
                        else:
                            url = f"{_base_url}{reuse_image.image_file.url}"
                        final_url = ensure_https_url(url)
                        # Cache for 1 hour
                        cache_article_data(cache_key, final_url, timeout=3600)
                        return final_url
                    except Exception:
                        continue  # Try next image if this one fails
        
        return None
    
    def get_reused_image_url(self, obj):
        """Return the URL of the primary reused image if available and exists"""
        if obj.reused_image and obj.reused_image.image_file:
            try:
                if obj.reused_image.image_file.name and obj.reused_image.image_file.storage.exists(obj.reused_image.image_file.name):
                    request = self.context.get('request')
                    if request:
                        return request.build_absolute_uri(obj.reused_image.image_file.url)
                    else:
                        from django.conf import settings
                        protocol = 'https' if not settings.DEBUG else 'http'
                        return f"{protocol}://dhivehinoos.net{obj.reused_image.image_file.url}"
            except Exception as e:
                print(f"⚠️  Warning: Error accessing reused image file: {e}")
        return None
    
    def get_reuse_images(self, obj):
        """Return all reuse images with their URLs and metadata"""
        reuse_images = []
        for image in obj.reuse_images.all():
            if image.image_file and image.image_file.name and image.image_file.storage.exists(image.image_file.name):
                try:
                    request = self.context.get('request')
                    if request:
                        image_url = request.build_absolute_uri(image.image_file.url)
                    else:
                        from django.conf import settings
                        protocol = 'https' if not settings.DEBUG else 'http'
                        image_url = f"{protocol}://dhivehinoos.net{image.image_file.url}"
                    
                    reuse_images.append({
                        'id': image.id,
                        'entity_name': image.entity_name,
                        'entity_type': image.entity_type,
                        'image_url': image_url,
                        'description': image.description,
                        'usage_count': image.usage_count
                    })
                except Exception as e:
                    print(f"⚠️  Warning: Error accessing reuse image {image.id}: {e}")
        return reuse_images
    
    def get_original_image_url(self, obj):
        """Return the URL of the original API image if available"""
        if obj.image and not obj.image.startswith('https://via.placeholder.com'):
            return obj.image
        return None
    
    def get_identified_entities(self, obj):
        """Return a list of identified public figures or institutions with their image URLs"""
        from articles.image_matching_service import ImageMatchingService
        service = ImageMatchingService()
        matches = service.find_matching_images(obj.content, obj.title)
        
        entities_info = []
        for match in matches:
            image = match['image']
            if image.image_file and image.image_file.name and image.image_file.storage.exists(image.image_file.name):
                request = self.context.get('request')
                image_url = request.build_absolute_uri(image.image_file.url) if request else f"https://dhivehinoos.net{image.image_file.url}"
                entities_info.append({
                    'name': image.entity_name,
                    'type': image.entity_type,
                    'image_url': image_url,
                    'confidence': match['confidence']
                })
        return entities_info
    
    def get_scheduled_publish_info(self, obj):
        """Return scheduling information if article is scheduled"""
        if hasattr(obj, 'scheduled_publish') and obj.scheduled_publish:
            return ScheduledArticleSerializer(obj.scheduled_publish).data
        return None
    
    def get_social_metadata(self, obj):
        """Return social sharing metadata"""
        request = self.context.get('request')
        base_url = 'https://dhivehinoos.net'
        
        # Use the article's URL property which handles proposed_url vs slug
        article_path = obj.article_url
        if article_path:
            if request:
                article_url = request.build_absolute_uri(article_path)
            else:
                article_url = f'{base_url}{article_path}'
        else:
            # Fallback to slug-based URL if no URL is available
            if request:
                article_url = request.build_absolute_uri(f'/article/{obj.slug}')
            else:
                article_url = f'{base_url}/article/{obj.slug}'
        
        # Get image URL for social sharing
        image_url = self.get_image_url(obj)
        if not image_url:
            image_url = f'{base_url}/static/favicon.svg'
        
        # Create description from content (first 160 characters)
        description = obj.title
        if obj.content:
            # Strip HTML tags and get first 160 characters
            import re
            clean_content = re.sub(r'<[^>]+>', '', obj.content)
            if len(clean_content) > 160:
                description = f"{obj.title} - {clean_content[:160]}..."
            else:
                description = f"{obj.title} - {clean_content}"
        
        return {
            'url': article_url,
            'title': obj.title,
            'description': description,
            'image': image_url,
            'site_name': 'Dhivehinoos.net',
            'type': 'article',
            'published_time': obj.created_at.isoformat() if obj.created_at else None,
            'modified_time': obj.updated_at.isoformat() if obj.updated_at else None,
            'author': 'Dhivehinoos.net',
            'category': obj.category.name if obj.category else None,
        }

    def get_matched_images(self, obj):
        """Return up to 4 matched reusable images (entities) detected for this article."""
        try:
            from .image_matching_service import ImageMatchingService
            service = ImageMatchingService()
            matches = service.find_matching_images(obj.content or '', obj.title or '')
            results = []
            request = self.context.get('request')
            base = 'https://dhivehinoos.net'
            for match in (matches or [])[:4]:
                image = match.get('image')
                if not image or not getattr(image, 'image_file', None):
                    continue
                try:
                    if image.image_file.name and image.image_file.storage.exists(image.image_file.name):
                        url = image.image_file.url
                        if request:
                            url = request.build_absolute_uri(url)
                        else:
                            from django.conf import settings
                            protocol = 'https' if not settings.DEBUG else 'http'
                            url = f"{protocol}://dhivehinoos.net{url}"
                        results.append({
                            'entity_name': image.entity_name,
                            'entity_type': image.entity_type,
                            'image_url': url,
                            'confidence': float(match.get('confidence', 0.0)),
                        })
                except Exception:
                    continue
            return results
        except Exception:
            return []
    
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
        
        # Update all fields including status - allow admin to change status as needed
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Save the instance
        instance.save()
        
        return instance
