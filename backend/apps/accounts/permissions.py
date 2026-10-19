from rest_framework import permissions

class IsCandidateUser(permissions.BasePermission):
    """
    Allows access only to candidate users.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == request.user.Role.CANDIDATE)

class IsCompanyUser(permissions.BasePermission):
    """
    Allows access only to company users.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == request.user.Role.COMPANY)

class IsAdminUserRole(permissions.BasePermission):
    """
    Allows access only to admin users.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == request.user.Role.ADMIN)

class IsCompanyOrAdminUser(permissions.BasePermission):
    """
    Allows access to company users or admin users.
    """
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in (request.user.Role.COMPANY, request.user.Role.ADMIN)
        )

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an object (or admins) to edit it.
    Assumes the model instance has a `user` attribute.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if request.user and request.user.is_authenticated and request.user.role == request.user.Role.ADMIN:
            return True
        return obj.user == request.user
