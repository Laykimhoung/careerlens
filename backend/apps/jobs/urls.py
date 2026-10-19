from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import JobViewSet, SkillViewSet, SavedJobViewSet, PlatformStatsView

router = DefaultRouter()
router.register(r'jobs', JobViewSet, basename='job')
router.register(r'skills', SkillViewSet, basename='skill')
router.register(r'saved-jobs', SavedJobViewSet, basename='saved-job')

urlpatterns = [
    path('platform-stats/', PlatformStatsView.as_view(), name='platform_stats'),
    path('', include(router.urls)),
]
