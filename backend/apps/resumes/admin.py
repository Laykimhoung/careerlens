from django.contrib import admin
from django.utils.html import format_html
from .models import Resume, ResumeVersion, CandidateUsage


@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = ('candidate', 'file_name', 'target_role', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('candidate__user__username', 'file_name', 'target_role')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-created_at',)


@admin.register(ResumeVersion)
class ResumeVersionAdmin(admin.ModelAdmin):
    list_display = (
        'candidate',
        'version_number',
        'title',
        'template',
        'current_badge',
        'approved_badge',
        'created_at',
    )
    list_filter = ('template', 'is_current', 'is_approved', 'created_at')
    search_fields = ('candidate__user__username', 'title')
    ordering = ('-created_at',)

    def current_badge(self, obj):
        if obj.is_current:
            return format_html('<span style="background:#ECFDF5;color:#047857;border:1px solid #A7F3D0;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600;">Active</span>')
        return format_html('<span style="background:#F1F5F9;color:#64748B;border:1px solid #E2E8F0;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:500;">Archive</span>')
    current_badge.short_description = "Current"

    def approved_badge(self, obj):
        if obj.is_approved:
            return format_html('<span style="background:#ECFDF5;color:#047857;border:1px solid #A7F3D0;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600;">Approved</span>')
        return format_html('<span style="background:#FFFBEB;color:#B45309;border:1px solid #FDE68A;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600;">Draft</span>')
    approved_badge.short_description = "Approval"


@admin.register(CandidateUsage)
class CandidateUsageAdmin(admin.ModelAdmin):
    list_display = ('candidate', 'plan_tier_badge', 'improvements_progress', 'updated_at')
    list_filter = ('plan_tier',)
    search_fields = ('candidate__user__username',)
    actions = ['upgrade_to_premium', 'reset_usage']

    def plan_tier_badge(self, obj):
        if obj.plan_tier == 'PREMIUM':
            return format_html('<span style="background:#EEF2FF;color:#4338CA;border:1px solid #C7D2FE;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:700;">PREMIUM</span>')
        return format_html('<span style="background:#F1F5F9;color:#475569;border:1px solid #E2E8F0;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600;">FREE</span>')
    plan_tier_badge.short_description = "Tier"

    def improvements_progress(self, obj):
        pct = min(100, int((obj.improvements_used / obj.improvements_limit) * 100)) if obj.improvements_limit else 0
        bar_color = '#DC2626' if pct >= 100 else '#059669'
        return format_html(
            '<div style="min-width:110px;">'
            '  <span style="font-size:11px;font-weight:600;color:#334155;">{}/{} used</span>'
            '  <div style="background:#E2E8F0;height:5px;border-radius:3px;overflow:hidden;margin-top:2px;">'
            '    <div style="background:{};width:{}%;height:100%;"></div>'
            '  </div>'
            '</div>',
            obj.improvements_used,
            obj.improvements_limit,
            bar_color,
            pct
        )
    improvements_progress.short_description = "Usage"

    @admin.action(description="Upgrade selected candidates to PREMIUM")
    def upgrade_to_premium(self, request, queryset):
        queryset.update(plan_tier='PREMIUM', improvements_limit=50)

    @admin.action(description="Reset improvements used to 0")
    def reset_usage(self, request, queryset):
        queryset.update(improvements_used=0)
