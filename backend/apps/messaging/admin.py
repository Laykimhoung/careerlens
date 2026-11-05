from django.contrib import admin
from django.utils.html import format_html
from .models import Message, Notification


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'recipient', 'text_preview', 'sent_at', 'read_badge')
    list_filter = ('sent_at',)
    search_fields = ('sender__username', 'recipient__username', 'text')
    ordering = ('-sent_at',)

    def text_preview(self, obj):
        return obj.text[:60] + ('...' if len(obj.text) > 60 else '')
    text_preview.short_description = "Message"

    def read_badge(self, obj):
        if obj.read_at:
            return format_html('<span style="color:#10B981;font-weight:600;">Read ({})</span>', obj.read_at.strftime("%b %d"))
        return format_html('<span style="color:#F59E0B;font-weight:600;">Unread</span>')
    read_badge.short_description = "Read Status"


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'type_badge', 'message_preview', 'is_read', 'created_at')
    list_filter = ('type', 'is_read', 'created_at')
    search_fields = ('user__username', 'message')
    ordering = ('-created_at',)
    actions = ['mark_as_read', 'mark_as_unread']

    def message_preview(self, obj):
        return obj.message[:60] + ('...' if len(obj.message) > 60 else '')
    message_preview.short_description = "Content"

    def type_badge(self, obj):
        colors = {
            'INFO': '#0284C7',
            'ALERT': '#EF4444',
            'SUCCESS': '#10B981',
        }
        color = colors.get(obj.type, '#64748B')
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700;">{}</span>',
            color,
            obj.get_type_display()
        )
    type_badge.short_description = "Type"

    @admin.action(description="Mark selected notifications as read")
    def mark_as_read(self, request, queryset):
        queryset.update(is_read=True)

    @admin.action(description="Mark selected notifications as unread")
    def mark_as_unread(self, request, queryset):
        queryset.update(is_read=False)
