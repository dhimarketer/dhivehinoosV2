from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import ContactMessage


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'email', 'message_preview', 'is_read', 'is_archived', 
        'created_at', 'action_buttons'
    ]
    list_filter = ['is_read', 'is_archived', 'created_at']
    search_fields = ['name', 'email', 'message']
    actions = ['mark_as_read', 'mark_as_unread', 'archive_messages', 'unarchive_messages', 'bulk_delete_messages']
    readonly_fields = ['created_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Contact Information', {
            'fields': ('name', 'email')
        }),
        ('Message', {
            'fields': ('message',)
        }),
        ('Status', {
            'fields': ('is_read', 'is_archived')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def message_preview(self, obj):
        """Display truncated message preview"""
        if len(obj.message) > 100:
            return obj.message[:100] + '...'
        return obj.message
    message_preview.short_description = 'Message Preview'
    
    def action_buttons(self, obj):
        """Display action buttons"""
        buttons = []
        
        if not obj.is_read:
            mark_read_url = reverse('admin:contact_contactmessage_mark_read', args=[obj.pk])
            buttons.append(
                format_html(
                    '<a class="button" href="{}" style="background-color: #007bff; color: white; padding: 2px 8px; text-decoration: none; border-radius: 3px; margin-right: 5px;">Mark Read</a>',
                    mark_read_url
                )
            )
        
        if not obj.is_archived:
            archive_url = reverse('admin:contact_contactmessage_archive', args=[obj.pk])
            buttons.append(
                format_html(
                    '<a class="button" href="{}" style="background-color: #6c757d; color: white; padding: 2px 8px; text-decoration: none; border-radius: 3px; margin-right: 5px;">Archive</a>',
                    archive_url
                )
            )
        
        return mark_safe(''.join(buttons)) if buttons else '-'
    action_buttons.short_description = 'Quick Actions'
    
    def mark_as_read(self, request, queryset):
        """Admin action to mark selected messages as read"""
        updated = queryset.filter(is_read=False).update(is_read=True)
        self.message_user(request, f'{updated} messages marked as read.')
    mark_as_read.short_description = "Mark selected messages as read"
    
    def mark_as_unread(self, request, queryset):
        """Admin action to mark selected messages as unread"""
        updated = queryset.filter(is_read=True).update(is_read=False)
        self.message_user(request, f'{updated} messages marked as unread.')
    mark_as_unread.short_description = "Mark selected messages as unread"
    
    def archive_messages(self, request, queryset):
        """Admin action to archive selected messages"""
        updated = queryset.filter(is_archived=False).update(is_archived=True)
        self.message_user(request, f'{updated} messages archived.')
    archive_messages.short_description = "Archive selected messages"
    
    def unarchive_messages(self, request, queryset):
        """Admin action to unarchive selected messages"""
        updated = queryset.filter(is_archived=True).update(is_archived=False)
        self.message_user(request, f'{updated} messages unarchived.')
    unarchive_messages.short_description = "Unarchive selected messages"
    
    def bulk_delete_messages(self, request, queryset):
        """Admin action to delete selected messages"""
        count = queryset.count()
        queryset.delete()
        self.message_user(request, f'{count} messages deleted.')
    bulk_delete_messages.short_description = "Delete selected messages"
