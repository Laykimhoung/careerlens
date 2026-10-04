from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from .models import Job, Skill, JobSkill, SavedJob
from .serializers import JobSerializer, SkillSerializer, JobSkillSerializer, SavedJobSerializer
from .permissions import IsJobOwnerOrReadOnly
from apps.accounts.permissions import IsCompanyUser, IsCandidateUser

class SkillViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Skills are globally readable.
    """
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer
    permission_classes = (permissions.AllowAny,)

class JobViewSet(viewsets.ModelViewSet):
    """
    Jobs can be viewed by anyone (list/retrieve), 
    but only created by companies, and updated/deleted by the owning company.
    """
    queryset = Job.objects.all().order_by('-created_at')
    serializer_class = JobSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated, IsCompanyUser, IsJobOwnerOrReadOnly]
        else:
            permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        qs = super().get_queryset()
        # If user is not authenticated or a candidate, only show published jobs
        if self.request.user.is_anonymous or (self.request.user.is_authenticated and self.request.user.role == self.request.user.Role.CANDIDATE):
            qs = qs.filter(status=Job.Status.PUBLISHED)
        elif self.request.user.is_authenticated and self.request.user.role == self.request.user.Role.COMPANY:
            # Companies see all their own jobs + published jobs from others?
            # Actually, companies should probably only manage their own jobs, but can see other published jobs.
            # We'll just show published jobs for safety, except for their own jobs.
            from django.db.models import Q
            qs = qs.filter(Q(status=Job.Status.PUBLISHED) | Q(company=self.request.user.company_profile))
        return qs

    def perform_create(self, serializer):
        from apps.accounts.utils import log_audit_action
        instance = serializer.save(company=self.request.user.company_profile)
        log_audit_action(
            actor=self.request.user,
            action="CREATE",
            target_type="Job",
            target_id=instance.id,
            details=f"Created job {instance.title}"
        )

    def perform_update(self, serializer):
        from apps.accounts.utils import log_audit_action
        instance = serializer.save()
        log_audit_action(
            actor=self.request.user,
            action="UPDATE",
            target_type="Job",
            target_id=instance.id,
            details=f"Updated job {instance.title}"
        )

    def perform_destroy(self, instance):
        from apps.accounts.utils import log_audit_action
        log_audit_action(
            actor=self.request.user,
            action="DELETE",
            target_type="Job",
            target_id=instance.id,
            details=f"Deleted job {instance.title}"
        )
        instance.delete()

class SavedJobViewSet(viewsets.ModelViewSet):
    """
    Candidates can save jobs.
    """
    serializer_class = SavedJobSerializer
    permission_classes = [permissions.IsAuthenticated, IsCandidateUser]

    def get_queryset(self):
        return SavedJob.objects.filter(candidate=self.request.user.candidate_profile)

    def perform_create(self, serializer):
        serializer.save(candidate=self.request.user.candidate_profile)
