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
        styles = {
            'ADMIN': ('#FEF2F2', '#991B1B', '#FECACA'),
            'COMPANY': ('#EEF2FF', '#4338CA', '#C7D2FE'),
            'CANDIDATE': ('#EFF6FF', '#1D4ED8', '#BFDBFE'),
        }
        bg, text, border = styles.get(obj.role, ('#F1F5F9', '#475569', '#E2E8F0'))
        return format_html(
            '<span style="background:{};color:{};border:1px solid {};padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600;">{}</span>',
            bg, text, border, obj.role or 'NONE'
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
        styles = {
            'VERIFIED': ('#ECFDF5', '#047857', '#A7F3D0', 'Verified'),
            'PENDING': ('#FFFBEB', '#B45309', '#FDE68A', 'Pending'),
            'REJECTED': ('#FEF2F2', '#B91C1C', '#FECACA', 'Rejected'),
        }
        bg, text, border, label = styles.get(obj.verification_status, ('#F1F5F9', '#475569', '#E2E8F0', obj.verification_status))
        return format_html(
            '<span style="background:{};color:{};border:1px solid {};padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600;">{}</span>',
            bg, text, border, label
        )
    verification_badge.short_description = "Status"

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
