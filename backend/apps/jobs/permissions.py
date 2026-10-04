from rest_framework import permissions

class IsJobOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return hasattr(request.user, 'company_profile') and obj.company == request.user.company_profile
