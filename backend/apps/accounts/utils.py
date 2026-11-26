from .models import AuditLog, CompanyProfile


def log_audit_action(actor, action, target_type, target_id, details=None):
    if not details:
        details = ""
    AuditLog.objects.create(
        actor=actor,
        action=action,
        target_type=target_type,
        target_id=str(target_id),
        details=details
    )


def ensure_company_profile(user):
    """
    Safely retrieves or provisions a CompanyProfile for an authenticated COMPANY user.
    Prevents RelatedObjectDoesNotExist 500 errors if a company user lacks a profile row.
    """
    if not user or not getattr(user, "is_authenticated", False):
        return None
    existing = getattr(user, "company_profile", None)
    if existing is not None:
        return existing
    if getattr(user, "role", None) == user.Role.COMPANY:
        default_name = f"{user.first_name} {user.last_name}".strip() or user.username
        profile, _ = CompanyProfile.objects.get_or_create(
            user=user,
            defaults={"company_name": default_name},
        )
        return profile
    return None
