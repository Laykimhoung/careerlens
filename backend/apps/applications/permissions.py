from rest_framework import permissions

class IsApplicationCompanyOrReadOnly(permissions.BasePermission):
    """
    Only the company that created the job can update the application status.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return hasattr(request.user, 'company_profile') and obj.job.company == request.user.company_profile
