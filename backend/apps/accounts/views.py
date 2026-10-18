from rest_framework import generics, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .serializers import (
    CustomTokenObtainPairSerializer,
    RegisterSerializer, 
    UserSerializer, 
    AdminUserSerializer,
    CandidateProfileSerializer, 
    CompanyProfileSerializer,
    AuditLogSerializer
)
from .models import CandidateProfile, CompanyProfile, AuditLog
from .permissions import IsOwnerOrReadOnly, IsAdminUserRole
from .utils import log_audit_action

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer


class CurrentUserView(generics.RetrieveUpdateAPIView):
    """
    Retrieve or update the authenticated user's core details.
    """
    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        return self.request.user


class UserViewSet(viewsets.ModelViewSet):
    """
    Admin-only user management endpoint.
    """
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = AdminUserSerializer
    permission_classes = (IsAuthenticated, IsAdminUserRole)

    def perform_create(self, serializer):
        instance = serializer.save()
        log_audit_action(
            actor=self.request.user,
            action="CREATE",
            target_type="User",
            target_id=instance.id,
            details=f"Admin created user {instance.username} ({instance.role})"
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        log_audit_action(
            actor=self.request.user,
            action="UPDATE",
            target_type="User",
            target_id=instance.id,
            details=f"Admin updated user {instance.username} (active={instance.is_active})"
        )

    def perform_destroy(self, instance):
        uname = instance.username
        uid = instance.id
        instance.delete()
        log_audit_action(
            actor=self.request.user,
            action="DELETE",
            target_type="User",
            target_id=uid,
            details=f"Admin deleted user {uname}"
        )


class CandidateProfileViewSet(viewsets.ModelViewSet):
    """
    View, list, and update candidate profiles.
    Only the profile owner (or an admin) can update their profile.
    """
    queryset = CandidateProfile.objects.select_related('user').prefetch_related('skills__skill').all().order_by('-user__date_joined')
    serializer_class = CandidateProfileSerializer
    permission_classes = (IsAuthenticated, IsOwnerOrReadOnly)

    def get_queryset(self):
        return super().get_queryset()

    def perform_update(self, serializer):
        instance = serializer.save()
        log_audit_action(
            actor=self.request.user,
            action="UPDATE",
            target_type="CandidateProfile",
            target_id=instance.id,
            details=f"Updated candidate profile for {instance.user.username}"
        )

    def perform_destroy(self, instance):
        user = instance.user
        cid = instance.id
        uname = user.username
        instance.delete()
        if user and user != self.request.user:
            user.delete()
        log_audit_action(
            actor=self.request.user,
            action="DELETE",
            target_type="CandidateProfile",
            target_id=cid,
            details=f"Deleted candidate profile {uname}"
        )


class CompanyProfileViewSet(viewsets.ModelViewSet):
    """
    View, list, and update company profiles.
    Only the profile owner (or an admin) can update their profile.
    """
    queryset = CompanyProfile.objects.select_related('user').all().order_by('-user__date_joined')
    serializer_class = CompanyProfileSerializer
    permission_classes = (IsAuthenticated, IsOwnerOrReadOnly)

    def get_queryset(self):
        return super().get_queryset()

    def perform_update(self, serializer):
        old_verif = self.get_object().verification_status
        instance = serializer.save()
        if old_verif != instance.verification_status:
            from apps.messaging.models import Notification
            log_audit_action(
                actor=self.request.user,
                action="VERIFY",
                target_type="CompanyProfile",
                target_id=instance.id,
                details=f"Admin updated verification for {instance.company_name} to {instance.verification_status}"
            )
            Notification.objects.create(
                user=instance.user,
                message=f"Your company ({instance.company_name}) verification status has been updated to {instance.verification_status}.",
                type=Notification.Type.SUCCESS if instance.verification_status == CompanyProfile.VerificationStatus.VERIFIED else Notification.Type.ALERT
            )
        else:
            log_audit_action(
                actor=self.request.user,
                action="UPDATE",
                target_type="CompanyProfile",
                target_id=instance.id,
                details=f"Updated company profile {instance.company_name}"
            )

    def perform_destroy(self, instance):
        user = instance.user
        cid = instance.id
        cname = instance.company_name
        instance.delete()
        if user and user != self.request.user:
            user.delete()
        log_audit_action(
            actor=self.request.user,
            action="DELETE",
            target_type="CompanyProfile",
            target_id=cid,
            details=f"Deleted company profile {cname}"
        )


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    View audit logs. Admins can view all, users can view their own.
    """
    serializer_class = AuditLogSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        if self.request.user.role == self.request.user.Role.ADMIN:
            return AuditLog.objects.all().order_by('-created_at')
        return AuditLog.objects.filter(actor=self.request.user).order_by('-created_at')


class AdminDashboardStatsView(generics.GenericAPIView):
    """
    Aggregates real database metrics, status distributions, time-series trends,
    top company rankings, and recent activity for the Admin Dashboard.
    """
    permission_classes = (IsAuthenticated, IsAdminUserRole)

    def get(self, request, *args, **kwargs):
        from datetime import timedelta
        from django.utils import timezone
        from django.db.models import Count
        from django.db.models.functions import TruncDate
        from apps.jobs.models import Job
        from apps.applications.models import Application

        range_param = request.query_params.get('range', 'all')
        now = timezone.now()
        cutoff = None
        if range_param == '7d':
            cutoff = now - timedelta(days=7)
        elif range_param == '30d':
            cutoff = now - timedelta(days=30)
        elif range_param == '90d':
            cutoff = now - timedelta(days=90)

        candidates_qs = CandidateProfile.objects.select_related('user').all()
        companies_qs = CompanyProfile.objects.select_related('user').all()
        jobs_qs = Job.objects.select_related('company').all()
        apps_qs = Application.objects.select_related('candidate__user', 'job__company').all()
        logs_qs = AuditLog.objects.select_related('actor').all().order_by('-created_at')

        if cutoff:
            apps_filtered = apps_qs.filter(applied_at__gte=cutoff)
            candidates_filtered = candidates_qs.filter(user__date_joined__gte=cutoff)
            jobs_filtered = jobs_qs.filter(created_at__gte=cutoff)
        else:
            apps_filtered = apps_qs
            candidates_filtered = candidates_qs
            jobs_filtered = jobs_qs

        total_candidates = candidates_qs.count()
        total_companies = companies_qs.count()
        verified_companies = companies_qs.filter(verification_status=CompanyProfile.VerificationStatus.VERIFIED).count()
        pending_verifications = companies_qs.filter(verification_status=CompanyProfile.VerificationStatus.PENDING).count()

        total_jobs = jobs_qs.count()
        active_jobs = jobs_qs.filter(status=Job.Status.PUBLISHED).count()

        total_applications = apps_qs.count()
        pending_reviews = apps_qs.filter(status__in=[Application.Status.APPLIED, Application.Status.REVIEWING]).count()

        app_status_counts = list(
            apps_filtered.values('status').annotate(count=Count('id')).order_by('-count')
        )
        job_status_counts = list(
            jobs_filtered.values('status').annotate(count=Count('id')).order_by('-count')
        )
        app_trends = list(
            apps_filtered.annotate(day=TruncDate('applied_at'))
            .values('day')
            .annotate(count=Count('id'))
            .order_by('day')
        )
        candidate_trends = list(
            candidates_filtered.annotate(day=TruncDate('user__date_joined'))
            .values('day')
            .annotate(count=Count('id'))
            .order_by('day')
        )

        return Response({
            'kpis': {
                'total_candidates': total_candidates,
                'total_companies': total_companies,
                'verified_companies': verified_companies,
                'pending_verifications': pending_verifications,
                'total_jobs': total_jobs,
                'active_jobs': active_jobs,
                'total_applications': total_applications,
                'pending_reviews': pending_reviews,
            },
            'application_status_distribution': app_status_counts,
            'job_status_distribution': job_status_counts,
            'application_trends': [
                {'date': str(item['day']), 'applications': item['count']}
                for item in app_trends if item['day']
            ],
            'candidate_registration_trends': [
                {'date': str(item['day']), 'registrations': item['count']}
                for item in candidate_trends if item['day']
            ],
            'recent_audit_logs': AuditLogSerializer(logs_qs[:5], many=True).data,
        })


