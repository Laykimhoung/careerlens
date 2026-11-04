from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import JobViewSet, SkillViewSet, SavedJobViewSet, PlatformStatsView, JobRecommendationView
from .roadmap_views import (
    RoadmapOptionsView,
    CareerRoadmapView,
    GenerateRoadmapView,
    UpdateMilestoneView,
    UpdateSkillStatusView,
    SyncSkillToProfileView,
    RecalculateRoadmapView,
)

router = DefaultRouter()
router.register(r'jobs', JobViewSet, basename='job')
router.register(r'skills', SkillViewSet, basename='skill')
router.register(r'saved-jobs', SavedJobViewSet, basename='saved-job')

urlpatterns = [
    path('platform-stats/', PlatformStatsView.as_view(), name='platform_stats'),
    path('recommendations/', JobRecommendationView.as_view(), name='job_recommendations'),
    # Career Roadmap
    path('roadmap/', CareerRoadmapView.as_view(), name='career_roadmap'),
    path('roadmap/options/', RoadmapOptionsView.as_view(), name='roadmap_options'),
    path('roadmap/generate/', GenerateRoadmapView.as_view(), name='generate_roadmap'),
    path('roadmap/milestones/', UpdateMilestoneView.as_view(), name='update_milestone'),
    path('roadmap/skills/', UpdateSkillStatusView.as_view(), name='update_skill_status'),
    path('roadmap/sync-skill/', SyncSkillToProfileView.as_view(), name='sync_skill_to_profile'),
    path('roadmap/recalculate/', RecalculateRoadmapView.as_view(), name='recalculate_roadmap'),
    path('', include(router.urls)),
]
