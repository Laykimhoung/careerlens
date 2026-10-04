from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ApplicationViewSet, ApplicationStatusHistoryViewSet, 
    InterviewViewSet, OfferViewSet, ApplicationNoteViewSet
)

router = DefaultRouter()
router.register(r'applications', ApplicationViewSet, basename='application')
router.register(r'application-history', ApplicationStatusHistoryViewSet, basename='application-history')
router.register(r'interviews', InterviewViewSet, basename='interview')
router.register(r'offers', OfferViewSet, basename='offer')
router.register(r'application-notes', ApplicationNoteViewSet, basename='application-note')

urlpatterns = [
    path('', include(router.urls)),
]
