from rest_framework import permissions

class IsApplicationCompanyOrReadOnly(permissions.BasePermission):
    """
    Only the company that created the job (or an admin) can update the application status.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if request.user and request.user.is_authenticated and request.user.role == request.user.Role.ADMIN:
            return True
        return hasattr(request.user, 'company_profile') and obj.job.company == request.user.company_profile
