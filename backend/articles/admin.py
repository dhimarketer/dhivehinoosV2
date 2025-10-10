from django.contrib import admin
from .models import Article, Category, PublishingSchedule, ScheduledArticle


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'color', 'icon', 'is_active', 'sort_order', 'articles_count']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description', 'keywords']
    prepopulated_fields = {'slug': ('name',)}
    ordering = ['sort_order', 'name']
    
    def articles_count(self, obj):
        return obj.articles.count()
    articles_count.short_description = 'Articles'


@admin.register(PublishingSchedule)
class PublishingScheduleAdmin(admin.ModelAdmin):
    list_display = ['name', 'frequency', 'is_active', 'queue_priority', 'max_articles_per_day', 'created_at']
    list_filter = ['is_active', 'frequency', 'created_at']
    search_fields = ['name']
    ordering = ['-queue_priority', 'name']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'is_active', 'queue_priority')
        }),
        ('Publishing Frequency', {
            'fields': ('frequency', 'custom_interval_minutes')
        }),
        ('Time Restrictions', {
            'fields': ('forbidden_hours_start', 'forbidden_hours_end'),
            'description': 'Set hours when articles should NOT be published (e.g., 22:00 to 08:00 for overnight)'
        }),
        ('Daily Limits', {
            'fields': ('max_articles_per_day',)
        }),
    )


@admin.register(ScheduledArticle)
class ScheduledArticleAdmin(admin.ModelAdmin):
    list_display = ['article', 'schedule', 'status', 'scheduled_publish_time', 'priority', 'created_at']
    list_filter = ['status', 'schedule', 'created_at', 'scheduled_publish_time']
    search_fields = ['article__title', 'schedule__name']
    ordering = ['scheduled_publish_time', '-priority']
    readonly_fields = ['created_at', 'updated_at', 'published_at']
    
    fieldsets = (
        ('Article Information', {
            'fields': ('article', 'schedule')
        }),
        ('Scheduling', {
            'fields': ('status', 'scheduled_publish_time', 'priority')
        }),
        ('Results', {
            'fields': ('published_at', 'failure_reason'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'status', 'publishing_mode', 'scheduled_publish_time', 'created_at', 'vote_score', 'approved_comments_count']
    list_filter = ['status', 'publishing_mode', 'category', 'created_at']
    search_fields = ['title', 'content']
    prepopulated_fields = {'slug': ('title',)}
    ordering = ['-created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'slug', 'content', 'category')
        }),
        ('Media', {
            'fields': ('image', 'image_file')
        }),
        ('Publishing', {
            'fields': ('status', 'publishing_mode', 'scheduled_publish_time')
        }),
    )
    
    actions = ['schedule_for_publishing', 'publish_now']
    
    def schedule_for_publishing(self, request, queryset):
        """Action to schedule selected articles for publishing"""
        from django.contrib import messages
        
        scheduled_count = 0
        for article in queryset.filter(status='draft'):
            try:
                article.schedule_for_publishing()
                scheduled_count += 1
            except Exception as e:
                messages.error(request, f"Failed to schedule '{article.title}': {str(e)}")
        
        if scheduled_count > 0:
            messages.success(request, f"Successfully scheduled {scheduled_count} article(s) for publishing.")
    
    schedule_for_publishing.short_description = "Schedule selected articles for publishing"
    
    def publish_now(self, request, queryset):
        """Action to publish selected articles immediately"""
        from django.contrib import messages
        
        published_count = 0
        for article in queryset:
            try:
                if article.publish_now():
                    published_count += 1
            except Exception as e:
                messages.error(request, f"Failed to publish '{article.title}': {str(e)}")
        
        if published_count > 0:
            messages.success(request, f"Successfully published {published_count} article(s).")
    
    publish_now.short_description = "Publish selected articles immediately"
