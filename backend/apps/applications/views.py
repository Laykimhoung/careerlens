from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Application
from apps.jobs.models import Job
from .serializers import ApplicationSerializer, ApplicationUpdateSerializer
from .permissions import IsApplicationCompanyOrReadOnly
from apps.accounts.permissions import IsCandidateUser, IsCompanyUser

class ApplicationViewSet(viewsets.ModelViewSet):
    """
    Candidates can create applications and view their own.
    Companies can view applications for their jobs and update statuses.
    """
    def get_queryset(self):
        if self.request.user.is_anonymous:
            return Application.objects.none()
            
        if self.request.user.role == self.request.user.Role.CANDIDATE:
            return Application.objects.filter(candidate=self.request.user.candidate_profile)
        elif self.request.user.role == self.request.user.Role.COMPANY:
            return Application.objects.filter(job__company=self.request.user.company_profile)
        return Application.objects.none()

    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return ApplicationUpdateSerializer
        return ApplicationSerializer

    def get_permissions(self):
        if self.action == 'create':
            permission_classes = [permissions.IsAuthenticated, IsCandidateUser]
        elif self.action in ['update', 'partial_update']:
            permission_classes = [permissions.IsAuthenticated, IsCompanyUser, IsApplicationCompanyOrReadOnly]
        elif self.action == 'destroy':
            # Optionally candidates can withdraw (delete) their application
            # but let's just use IsAuthenticated and handle in view logic.
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        job_id = serializer.validated_data.get('job_id')
        job = get_object_or_404(Job, id=job_id, status=Job.Status.PUBLISHED)
        
        serializer.save(
            candidate=self.request.user.candidate_profile,
            job=job
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # Only candidate can withdraw their own application
        if hasattr(request.user, 'candidate_profile') and instance.candidate == request.user.candidate_profile:
            self.perform_destroy(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response({"detail": "Not authorized to withdraw this application."}, status=status.HTTP_403_FORBIDDEN)
