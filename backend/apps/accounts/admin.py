from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from .models import User, CandidateProfile, CompanyProfile, CandidateSkill, AuditLog


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'role_badge', 'is_active', 'is_staff', 'date_joined')
    list_filter = ('role', 'is_active', 'is_staff', 'is_superuser')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('-date_joined',)

    fieldsets = UserAdmin.fieldsets + (
        ("CareerLens Role & Permissions", {"fields": ("role",)}),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        ("CareerLens Role & Permissions", {"fields": ("email", "role")}),
    )

    def role_badge(self, obj):
        color_map = {
            'ADMIN': '#DC2626',
            'COMPANY': '#6366F1',
            'CANDIDATE': '#0284C7',
        }
        color = color_map.get(obj.role, '#64748B')
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700;">{}</span>',
            color,
            obj.role or 'NONE'
        )
    role_badge.short_description = "Role"


@admin.register(CandidateProfile)
class CandidateProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'university', 'major', 'graduation_year')
    search_fields = ('user__username', 'user__email', 'university', 'major')
    list_filter = ('university', 'graduation_year')


@admin.register(CompanyProfile)
class CompanyProfileAdmin(admin.ModelAdmin):
    list_display = ('company_name', 'user', 'industry', 'location', 'verification_badge')
    list_filter = ('verification_status', 'industry')
    search_fields = ('company_name', 'user__username', 'industry', 'location')
    actions = ['verify_companies', 'reject_companies', 'set_pending_companies']

    def verification_badge(self, obj):
        colors = {
            'VERIFIED': ('#10B981', 'Verified'),
            'PENDING': ('#F59E0B', 'Pending'),
            'REJECTED': ('#EF4444', 'Rejected'),
        }
        color, label = colors.get(obj.verification_status, ('#64748B', obj.verification_status))
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700;">{}</span>',
            color,
            label
        )
    verification_badge.short_description = "Verification"

    @admin.action(description="Verify selected companies")
    def verify_companies(self, request, queryset):
        queryset.update(verification_status=CompanyProfile.VerificationStatus.VERIFIED)

    @admin.action(description="Reject selected companies")
    def reject_companies(self, request, queryset):
        queryset.update(verification_status=CompanyProfile.VerificationStatus.REJECTED)

    @admin.action(description="Mark selected companies as Pending")
    def set_pending_companies(self, request, queryset):
        queryset.update(verification_status=CompanyProfile.VerificationStatus.PENDING)


@admin.register(CandidateSkill)
class CandidateSkillAdmin(admin.ModelAdmin):
    list_display = ('candidate', 'skill', 'proficiency')
    list_filter = ('proficiency',)
    search_fields = ('candidate__user__username', 'skill__name')


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('created_at', 'actor', 'action', 'target_type', 'target_id')
    list_filter = ('created_at', 'target_type')
    search_fields = ('action', 'actor__username', 'target_type', 'target_id', 'details')
    readonly_fields = ('actor', 'action', 'target_type', 'target_id', 'details', 'created_at')
    ordering = ('-created_at',)

    def has_add_permission(self, request):
        return False
