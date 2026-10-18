from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from .models import Job, Skill, JobSkill, SavedJob
from .serializers import JobSerializer, SkillSerializer, JobSkillSerializer, SavedJobSerializer
from .permissions import IsJobOwnerOrReadOnly
from apps.accounts.permissions import IsCompanyUser, IsCandidateUser, IsAdminUserRole, IsCompanyOrAdminUser
from apps.accounts.models import CompanyProfile

class SkillViewSet(viewsets.ModelViewSet):
    """
    Skills are globally readable. Admins can create or delete skills.
    """
    queryset = Skill.objects.all().order_by('name')
    serializer_class = SkillSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsAdminUserRole()]

class JobViewSet(viewsets.ModelViewSet):
    """
    Jobs can be viewed by anyone (list/retrieve), 
    but only created by companies (or admins), and updated/deleted by the owning company (or admins).
    """
    queryset = Job.objects.select_related('company__user').prefetch_related('job_skills__skill').all().order_by('-created_at')
    serializer_class = JobSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated, IsCompanyOrAdminUser, IsJobOwnerOrReadOnly]
        else:
            permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        qs = super().get_queryset()
        # If user is not authenticated or a candidate, only show published jobs
        if self.request.user.is_anonymous or (self.request.user.is_authenticated and self.request.user.role == self.request.user.Role.CANDIDATE):
            qs = qs.filter(status=Job.Status.PUBLISHED)
        elif self.request.user.is_authenticated and self.request.user.role == self.request.user.Role.COMPANY:
            from django.db.models import Q
            qs = qs.filter(Q(status=Job.Status.PUBLISHED) | Q(company=self.request.user.company_profile))
        return qs

    def perform_create(self, serializer):
        from apps.accounts.utils import log_audit_action
        company_profile = getattr(self.request.user, 'company_profile', None)
        if not company_profile and self.request.user.role == self.request.user.Role.ADMIN:
            comp_id = self.request.data.get('company_id')
            comp_name = self.request.data.get('company_name')
            if comp_id:
                company_profile = CompanyProfile.objects.filter(id=comp_id).first()
            if not company_profile and comp_name:
                company_profile = CompanyProfile.objects.filter(company_name__iexact=comp_name.strip()).first()
            if not company_profile:
                company_profile = CompanyProfile.objects.first()
        instance = serializer.save(company=company_profile)
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
        return (
            SavedJob.objects.select_related('job__company__user')
            .prefetch_related('job__job_skills__skill')
            .filter(candidate=self.request.user.candidate_profile)
            .order_by('-created_at')
        )

    def perform_create(self, serializer):
        from django.db import IntegrityError, transaction
        from rest_framework import serializers as drf_serializers
        job = serializer.validated_data.get('job')
        if SavedJob.objects.filter(candidate=self.request.user.candidate_profile, job=job).exists():
            raise drf_serializers.ValidationError({"detail": "Job is already saved."})
        try:
            with transaction.atomic():
                serializer.save(candidate=self.request.user.candidate_profile)
        except IntegrityError:
            raise drf_serializers.ValidationError({"detail": "Job is already saved."})

