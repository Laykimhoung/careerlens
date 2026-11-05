from django.contrib import admin
from django.utils.html import format_html
from .models import Application, ApplicationStatusHistory, Interview, Offer, ApplicationNote


class ApplicationStatusHistoryInline(admin.TabularInline):
    model = ApplicationStatusHistory
    extra = 0
    readonly_fields = ('changed_by', 'old_status', 'new_status', 'note', 'created_at')
    can_delete = False


class ApplicationNoteInline(admin.TabularInline):
    model = ApplicationNote
    extra = 1


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ('candidate', 'job', 'status_badge', 'applied_at', 'updated_at')
    list_filter = ('status', 'applied_at')
    search_fields = (
        'candidate__user__username',
        'candidate__user__email',
        'job__title',
        'job__company__company_name',
    )
    inlines = [ApplicationStatusHistoryInline, ApplicationNoteInline]
    actions = ['mark_reviewing', 'mark_interview', 'mark_offered', 'mark_rejected']

    def status_badge(self, obj):
        colors = {
            'APPLIED': '#0284C7',      # sky
            'REVIEWING': '#F59E0B',    # amber
            'SHORTLISTED': '#6366F1',  # indigo
            'INTERVIEW': '#8B5CF6',    # violet
            'OFFERED': '#10B981',      # emerald
            'REJECTED': '#EF4444',     # rose
        }
        color = colors.get(obj.status, '#64748B')
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = "Status"

    @admin.action(description="Move selected to Reviewing")
    def mark_reviewing(self, request, queryset):
        queryset.update(status=Application.Status.REVIEWING)

    @admin.action(description="Move selected to Interview")
    def mark_interview(self, request, queryset):
        queryset.update(status=Application.Status.INTERVIEW)

    @admin.action(description="Move selected to Offered")
    def mark_offered(self, request, queryset):
        queryset.update(status=Application.Status.OFFERED)

    @admin.action(description="Move selected to Rejected")
    def mark_rejected(self, request, queryset):
        queryset.update(status=Application.Status.REJECTED)


@admin.register(ApplicationStatusHistory)
class ApplicationStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ('application', 'old_status', 'new_status', 'changed_by', 'created_at')
    list_filter = ('new_status', 'created_at')
    search_fields = ('application__candidate__user__username', 'application__job__title')
    readonly_fields = ('application', 'changed_by', 'old_status', 'new_status', 'note', 'created_at')
    ordering = ('-created_at',)

    def has_add_permission(self, request):
        return False


@admin.register(Interview)
class InterviewAdmin(admin.ModelAdmin):
    list_display = ('application', 'scheduled_by', 'scheduled_at', 'status', 'location')
    list_filter = ('status', 'scheduled_at')
    search_fields = ('application__candidate__user__username', 'application__job__title', 'location')


@admin.register(Offer)
class OfferAdmin(admin.ModelAdmin):
    list_display = ('application', 'salary_display', 'status_badge', 'sent_at', 'responded_at')
    list_filter = ('status', 'currency', 'sent_at')
    search_fields = ('application__candidate__user__username', 'application__job__title')

    def salary_display(self, obj):
        return f"{obj.salary:,.2f} {obj.currency}"
    salary_display.short_description = "Compensation"

    def status_badge(self, obj):
        colors = {
            'PENDING': '#F59E0B',
            'ACCEPTED': '#10B981',
            'DECLINED': '#EF4444',
        }
        color = colors.get(obj.status, '#64748B')
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = "Status"


@admin.register(ApplicationNote)
class ApplicationNoteAdmin(admin.ModelAdmin):
    list_display = ('application', 'author', 'created_at', 'short_note')
    search_fields = ('application__candidate__user__username', 'author__username', 'note')
    list_filter = ('created_at',)

    def short_note(self, obj):
        return obj.note[:60] + ('...' if len(obj.note) > 60 else '')
    short_note.short_description = "Note Preview"
