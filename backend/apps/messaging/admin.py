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
            return format_html(
                '<span style="background:#ECFDF5;color:#047857;border:1px solid #A7F3D0;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600;">Read ({})</span>',
                obj.read_at.strftime("%b %d")
            )
        return format_html(
            '<span style="background:#FFFBEB;color:#B45309;border:1px solid #FDE68A;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600;">Unread</span>'
        )
    read_badge.short_description = "Status"


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
        styles = {
            'INFO': ('#EFF6FF', '#1D4ED8', '#BFDBFE'),
            'ALERT': ('#FEF2F2', '#B91C1C', '#FECACA'),
            'SUCCESS': ('#ECFDF5', '#047857', '#A7F3D0'),
        }
        bg, text, border = styles.get(obj.type, ('#F1F5F9', '#475569', '#E2E8F0'))
        return format_html(
            '<span style="background:{};color:{};border:1px solid {};padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600;">{}</span>',
            bg, text, border, obj.get_type_display()
        )
    type_badge.short_description = "Type"

    @admin.action(description="Mark selected notifications as read")
    def mark_as_read(self, request, queryset):
        queryset.update(is_read=True)

    @admin.action(description="Mark selected notifications as unread")
    def mark_as_unread(self, request, queryset):
        queryset.update(is_read=False)
