from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import (
    RegisterView,
    CurrentUserView,
    CandidateProfileViewSet,
    CompanyProfileViewSet,
    AuditLogViewSet
)

router = DefaultRouter()
router.register(r'candidates', CandidateProfileViewSet, basename='candidate')
router.register(r'companies', CompanyProfileViewSet, basename='company')
router.register(r'audit-logs', AuditLogViewSet, basename='auditlog')

urlpatterns = [
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', RegisterView.as_view(), name='register'),
    path('me/', CurrentUserView.as_view(), name='current_user'),
    path('', include(router.urls)),
]
