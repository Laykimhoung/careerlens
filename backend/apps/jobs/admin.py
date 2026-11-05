from django.contrib import admin
from django.utils.html import format_html
from .models import Skill, Job, JobSkill, SavedJob, CandidateRoadmap


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)
    ordering = ('name',)


class JobSkillInline(admin.TabularInline):
    model = JobSkill
    extra = 1


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = (
        'title',
        'company',
        'employment_type',
        'workplace_type',
        'salary_range',
        'status_badge',
        'created_at',
    )
    list_filter = ('status', 'employment_type', 'workplace_type', 'created_at')
    search_fields = ('title', 'company__company_name', 'location', 'description')
    inlines = [JobSkillInline]
    actions = ['publish_jobs', 'close_jobs', 'draft_jobs']

    def status_badge(self, obj):
        styles = {
            'PUBLISHED': ('#ECFDF5', '#047857', '#A7F3D0'),
            'DRAFT': ('#F1F5F9', '#475569', '#E2E8F0'),
            'CLOSED': ('#FEF2F2', '#B91C1C', '#FECACA'),
        }
        bg, text, border = styles.get(obj.status, ('#F1F5F9', '#475569', '#E2E8F0'))
        return format_html(
            '<span style="background:{};color:{};border:1px solid {};padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600;">{}</span>',
            bg, text, border, obj.get_status_display()
        )
    status_badge.short_description = "Status"

    def salary_range(self, obj):
        if obj.salary_min and obj.salary_max:
            return f"${obj.salary_min:,.0f} - ${obj.salary_max:,.0f}"
        if obj.salary_min:
            return f"From ${obj.salary_min:,.0f}"
        if obj.salary_max:
            return f"Up to ${obj.salary_max:,.0f}"
        return "Negotiable"
    salary_range.short_description = "Salary"

    @admin.action(description="Publish selected jobs")
    def publish_jobs(self, request, queryset):
        queryset.update(status=Job.Status.PUBLISHED)

    @admin.action(description="Close selected jobs")
    def close_jobs(self, request, queryset):
        queryset.update(status=Job.Status.CLOSED)

    @admin.action(description="Revert selected jobs to Draft")
    def draft_jobs(self, request, queryset):
        queryset.update(status=Job.Status.DRAFT)


@admin.register(JobSkill)
class JobSkillAdmin(admin.ModelAdmin):
    list_display = ('job', 'skill')
    list_filter = ('skill',)
    search_fields = ('job__title', 'skill__name')


@admin.register(SavedJob)
class SavedJobAdmin(admin.ModelAdmin):
    list_display = ('candidate', 'job', 'created_at')
    search_fields = ('candidate__user__username', 'job__title')
    list_filter = ('created_at',)


@admin.register(CandidateRoadmap)
class CandidateRoadmapAdmin(admin.ModelAdmin):
    list_display = ('candidate', 'target_role', 'weekly_hours', 'created_at', 'updated_at')
    search_fields = ('candidate__user__username', 'target_role')
    readonly_fields = ('created_at', 'updated_at')
