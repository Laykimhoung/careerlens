from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Application, ApplicationStatusHistory, Interview, Offer, ApplicationNote
from apps.jobs.models import Job
from apps.accounts.models import CandidateProfile
from .serializers import (
    ApplicationSerializer, ApplicationUpdateSerializer, 
    ApplicationStatusHistorySerializer, InterviewSerializer, 
    OfferSerializer, ApplicationNoteSerializer
)
from .permissions import IsApplicationCompanyOrReadOnly
from apps.accounts.permissions import IsCandidateUser, IsCompanyUser, IsCompanyOrAdminUser
from apps.accounts.utils import log_audit_action

class ApplicationViewSet(viewsets.ModelViewSet):
    """
    Candidates can create applications and view their own.
    Companies can view applications for their jobs and update statuses.
    Admins can view and manage all applications.
    """
    def get_queryset(self):
        if self.request.user.is_anonymous:
            return Application.objects.none()
            
        base_qs = Application.objects.select_related('candidate__user', 'job__company__user').prefetch_related('candidate__skills__skill', 'job__job_skills__skill')
        if self.request.user.role == self.request.user.Role.ADMIN:
            return base_qs.all().order_by('-applied_at')
        elif self.request.user.role == self.request.user.Role.CANDIDATE:
            return base_qs.filter(candidate=self.request.user.candidate_profile).order_by('-applied_at')
        elif self.request.user.role == self.request.user.Role.COMPANY:
            return base_qs.filter(job__company=self.request.user.company_profile).order_by('-applied_at')
        return Application.objects.none()

    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return ApplicationUpdateSerializer
        return ApplicationSerializer

    def get_permissions(self):
        if self.action == 'create':
            if self.request.user and self.request.user.is_authenticated and self.request.user.role == self.request.user.Role.ADMIN:
                permission_classes = [permissions.IsAuthenticated]
            else:
                permission_classes = [permissions.IsAuthenticated, IsCandidateUser]
        elif self.action in ['update', 'partial_update']:
            permission_classes = [permissions.IsAuthenticated, IsCompanyOrAdminUser, IsApplicationCompanyOrReadOnly]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        from django.db import IntegrityError, transaction
        from rest_framework import serializers
        
        job_id = serializer.validated_data.get('job_id')
        if self.request.user.role == self.request.user.Role.ADMIN:
            job = get_object_or_404(Job, id=job_id)
            cand_id = self.request.data.get('candidate_id') or self.request.data.get('candidate')
            candidate_profile = get_object_or_404(CandidateProfile, id=cand_id)
            initial_status = self.request.data.get('status', Application.Status.APPLIED)
            if initial_status not in Application.Status.values:
                initial_status = Application.Status.APPLIED
        else:
            job = get_object_or_404(Job, id=job_id, status=Job.Status.PUBLISHED)
            candidate_profile = self.request.user.candidate_profile
            initial_status = Application.Status.APPLIED

        if Application.objects.filter(candidate=candidate_profile, job=job).exists():
            raise serializers.ValidationError({"detail": "You have already applied for this job."})
        
        try:
            with transaction.atomic():
                instance = serializer.save(
                    candidate=candidate_profile,
                    job=job,
                    status=initial_status
                )
                ApplicationStatusHistory.objects.create(
                    application=instance,
                    changed_by=self.request.user,
                    old_status="",
                    new_status=instance.status,
                    note="Application submitted"
                )
                log_audit_action(
                    actor=self.request.user,
                    action="CREATE",
                    target_type="Application",
                    target_id=instance.id,
                    details=f"{candidate_profile.user.username} applied to {job.title}"
                )
        except IntegrityError:
            raise serializers.ValidationError({"detail": "You have already applied for this job."})

    def perform_update(self, serializer):
        old_status = self.get_object().status
        instance = serializer.save()
        
        if old_status != instance.status:
            from apps.messaging.models import Notification
            ApplicationStatusHistory.objects.create(
                application=instance,
                changed_by=self.request.user,
                old_status=old_status,
                new_status=instance.status,
                note=f"Status updated from {old_status} to {instance.status}"
            )
            Notification.objects.create(
                user=instance.candidate.user,
                message=f"Your application for '{instance.job.title}' at {instance.job.company.company_name} has been updated to {instance.status}.",
                type=Notification.Type.SUCCESS if instance.status == Application.Status.OFFERED else Notification.Type.INFO
            )
            log_audit_action(
                actor=self.request.user,
                action="UPDATE",
                target_type="Application",
                target_id=instance.id,
                details=f"Updated application #{instance.id} status to {instance.status}"
            )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # Candidate can withdraw their own application, or Admin can delete
        if (hasattr(request.user, 'candidate_profile') and instance.candidate == request.user.candidate_profile) or request.user.role == request.user.Role.ADMIN:
            aid = instance.id
            title = instance.job.title
            self.perform_destroy(instance)
            log_audit_action(
                actor=request.user,
                action="DELETE",
                target_type="Application",
                target_id=aid,
                details=f"Deleted/withdrew application #{aid} for {title}"
            )
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response({"detail": "Not authorized to withdraw this application."}, status=status.HTTP_403_FORBIDDEN)

class ApplicationStatusHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only view for application status history.
    """
    serializer_class = ApplicationStatusHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == self.request.user.Role.ADMIN:
            return ApplicationStatusHistory.objects.all().order_by('created_at')
        elif self.request.user.role == self.request.user.Role.CANDIDATE:
            return ApplicationStatusHistory.objects.filter(application__candidate=self.request.user.candidate_profile).order_by('created_at')
        elif self.request.user.role == self.request.user.Role.COMPANY:
            return ApplicationStatusHistory.objects.filter(application__job__company=self.request.user.company_profile).order_by('created_at')
        return ApplicationStatusHistory.objects.none()

class InterviewViewSet(viewsets.ModelViewSet):
    serializer_class = InterviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == self.request.user.Role.ADMIN:
            return Interview.objects.all().order_by('scheduled_at')
        elif self.request.user.role == self.request.user.Role.CANDIDATE:
            return Interview.objects.filter(application__candidate=self.request.user.candidate_profile).order_by('scheduled_at')
        elif self.request.user.role == self.request.user.Role.COMPANY:
            return Interview.objects.filter(application__job__company=self.request.user.company_profile).order_by('scheduled_at')
        return Interview.objects.none()

    def perform_create(self, serializer):
        if self.request.user.role not in (self.request.user.Role.COMPANY, self.request.user.Role.ADMIN):
            raise PermissionDenied("Only companies can schedule interviews.")
        
        application = serializer.validated_data.get('application')
        if self.request.user.role == self.request.user.Role.COMPANY and application.job.company != self.request.user.company_profile:
            raise PermissionDenied("You do not own this application.")

        instance = serializer.save(scheduled_by=self.request.user)
        from apps.messaging.models import Notification
        Notification.objects.create(
            user=application.candidate.user,
            message=f"An interview has been scheduled for '{application.job.title}' at {application.job.company.company_name}.",
            type=Notification.Type.INFO
        )
        log_audit_action(
            actor=self.request.user,
            action="CREATE",
            target_type="Interview",
            target_id=instance.id,
            details=f"Scheduled interview for {application.candidate.user.username} ({application.job.title})"
        )

class OfferViewSet(viewsets.ModelViewSet):
    serializer_class = OfferSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == self.request.user.Role.ADMIN:
            return Offer.objects.all().order_by('-sent_at')
        elif self.request.user.role == self.request.user.Role.CANDIDATE:
            return Offer.objects.filter(application__candidate=self.request.user.candidate_profile).order_by('-sent_at')
        elif self.request.user.role == self.request.user.Role.COMPANY:
            return Offer.objects.filter(application__job__company=self.request.user.company_profile).order_by('-sent_at')
        return Offer.objects.none()

    def perform_create(self, serializer):
        if self.request.user.role not in (self.request.user.Role.COMPANY, self.request.user.Role.ADMIN):
            raise PermissionDenied("Only companies can send offers.")
        
        application = serializer.validated_data.get('application')
        if self.request.user.role == self.request.user.Role.COMPANY and application.job.company != self.request.user.company_profile:
            raise PermissionDenied("You do not own this application.")

        instance = serializer.save()
        if application.status != Application.Status.OFFERED:
            old_st = application.status
            application.status = Application.Status.OFFERED
            application.save()
            ApplicationStatusHistory.objects.create(
                application=application,
                changed_by=self.request.user,
                old_status=old_st,
                new_status=Application.Status.OFFERED,
                note="Job offer extended"
            )
        from apps.messaging.models import Notification
        Notification.objects.create(
            user=application.candidate.user,
            message=f"Congratulations! You received a job offer for '{application.job.title}' from {application.job.company.company_name}.",
            type=Notification.Type.SUCCESS
        )

    def update(self, request, *args, **kwargs):
        # Map "REJECTED" (from API.md) to "DECLINED" (in Offer.Status) if sent
        if isinstance(request.data, dict) and request.data.get('status') == 'REJECTED':
            request.data['status'] = Offer.Status.DECLINED
        return super().update(request, *args, **kwargs)

    def perform_update(self, serializer):
        instance = serializer.save(responded_at=timezone.now())
        return instance

class ApplicationNoteViewSet(viewsets.ModelViewSet):
    serializer_class = ApplicationNoteSerializer
    permission_classes = [permissions.IsAuthenticated, IsCompanyOrAdminUser]

    def get_queryset(self):
        if self.request.user.role == self.request.user.Role.ADMIN:
            return ApplicationNote.objects.all().order_by('-created_at')
        return ApplicationNote.objects.filter(application__job__company=self.request.user.company_profile).order_by('-created_at')

    def perform_create(self, serializer):
        application = serializer.validated_data.get('application')
        if self.request.user.role == self.request.user.Role.COMPANY and application.job.company != self.request.user.company_profile:
            raise PermissionDenied("You do not own this application.")
        serializer.save(author=self.request.user)
