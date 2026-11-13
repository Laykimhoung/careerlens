from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CustomTokenObtainPairView,
    ThrottledTokenRefreshView,
    RegisterView,
    CurrentUserView,
    UserViewSet,
    CandidateProfileViewSet,
    CompanyProfileViewSet,
    AuditLogViewSet,
    AdminDashboardStatsView,
    GeminiKeyView,
    ForgotPasswordView,
    ResetPasswordView,
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'candidates', CandidateProfileViewSet, basename='candidate')
router.register(r'companies', CompanyProfileViewSet, basename='company')
router.register(r'audit-logs', AuditLogViewSet, basename='auditlog')

urlpatterns = [
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('login/refresh/', ThrottledTokenRefreshView.as_view(), name='token_refresh'),
    path('register/', RegisterView.as_view(), name='register'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot_password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset_password'),
    path('me/', CurrentUserView.as_view(), name='current_user'),
    path('gemini-key/', GeminiKeyView.as_view(), name='gemini_key'),
    path('admin/dashboard/', AdminDashboardStatsView.as_view(), name='admin_dashboard_stats'),
    path('', include(router.urls)),
]
