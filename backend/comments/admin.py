from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import Comment, Vote


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = [
        'article_link', 'author_name', 'content_preview', 'is_approved', 
        'ip_address', 'created_at', 'action_buttons'
    ]
    list_filter = ['is_approved', 'created_at', 'article__category']
    search_fields = ['author_name', 'content', 'article__title']
    actions = ['approve_comments', 'reject_comments', 'bulk_delete_comments']
    readonly_fields = ['ip_address', 'created_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Comment Information', {
            'fields': ('article', 'author_name', 'content')
        }),
        ('Moderation', {
            'fields': ('is_approved',)
        }),
        ('Technical Details', {
            'fields': ('ip_address', 'created_at'),
            'classes': ('collapse',)
        }),
    )
    
    def article_link(self, obj):
        """Display article title as a link"""
        url = reverse('admin:articles_article_change', args=[obj.article.pk])
        return format_html('<a href="{}">{}</a>', url, obj.article.title)
    article_link.short_description = 'Article'
    article_link.admin_order_field = 'article__title'
    
    def content_preview(self, obj):
        """Display truncated content preview"""
        if len(obj.content) > 100:
            return obj.content[:100] + '...'
        return obj.content
    content_preview.short_description = 'Content Preview'
    
    def action_buttons(self, obj):
        """Display action buttons"""
        if not obj.is_approved:
            approve_url = reverse('admin:comments_comment_approve', args=[obj.pk])
            return format_html(
                '<a class="button" href="{}" style="background-color: #28a745; color: white; padding: 2px 8px; text-decoration: none; border-radius: 3px;">Approve</a>',
                approve_url
            )
        else:
            reject_url = reverse('admin:comments_comment_reject', args=[obj.pk])
            return format_html(
                '<a class="button" href="{}" style="background-color: #dc3545; color: white; padding: 2px 8px; text-decoration: none; border-radius: 3px;">Reject</a>',
                reject_url
            )
    action_buttons.short_description = 'Quick Actions'
    
    def approve_comments(self, request, queryset):
        """Admin action to approve selected comments"""
        updated = queryset.filter(is_approved=False).update(is_approved=True)
        self.message_user(request, f'{updated} comments approved.')
    approve_comments.short_description = "Approve selected comments"
    
    def reject_comments(self, request, queryset):
        """Admin action to reject selected comments"""
        updated = queryset.filter(is_approved=True).update(is_approved=False)
        self.message_user(request, f'{updated} comments rejected.')
    reject_comments.short_description = "Reject selected comments"
    
    def bulk_delete_comments(self, request, queryset):
        """Admin action to delete selected comments"""
        count = queryset.count()
        queryset.delete()
        self.message_user(request, f'{count} comments deleted.')
    bulk_delete_comments.short_description = "Delete selected comments"


@admin.register(Vote)
class VoteAdmin(admin.ModelAdmin):
    list_display = [
        'article_link', 'vote_type', 'ip_address', 'created_at'
    ]
    list_filter = ['vote_type', 'created_at', 'article__category']
    search_fields = ['article__title', 'ip_address']
    readonly_fields = ['ip_address', 'created_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Vote Information', {
            'fields': ('article', 'vote_type', 'ip_address')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def article_link(self, obj):
        """Display article title as a link"""
        url = reverse('admin:articles_article_change', args=[obj.article.pk])
        return format_html('<a href="{}">{}</a>', url, obj.article.title)
    article_link.short_description = 'Article'
    article_link.admin_order_field = 'article__title'
