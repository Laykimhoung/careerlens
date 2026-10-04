from .models import AuditLog

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
