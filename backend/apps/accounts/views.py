import logging
from rest_framework import generics, viewsets, status, permissions
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from .serializers import (
    CustomTokenObtainPairSerializer,
    RegisterSerializer, 
    UserSerializer, 
    AdminUserSerializer,
    CandidateProfileSerializer, 
    CompanyProfileSerializer,
    AuditLogSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
)
from .models import CandidateProfile, CompanyProfile, AuditLog
from .permissions import IsOwnerOrReadOnly, IsAdminUserRole
from .utils import log_audit_action

logger = logging.getLogger(__name__)

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




class GeminiKeyView(APIView):
    """
    Manages the candidate's personal Google Gemini API key.
    Allows students to plug in their own Gemini API key to power AI features.
    """
    permission_classes = [permissions.IsAuthenticated]

    def _get_candidate(self, request):
        if hasattr(request.user, "candidate_profile"):
            return request.user.candidate_profile
        if request.user.role == request.user.Role.CANDIDATE:
            profile, _ = CandidateProfile.objects.get_or_create(user=request.user)
            return profile
        if request.user.role == request.user.Role.ADMIN:
            return CandidateProfile.objects.first()
        return None

    def get(self, request):
        candidate = self._get_candidate(request)
        if not candidate:
            return Response({"detail": "Candidate profile required."}, status=status.HTTP_400_BAD_REQUEST)

        has_key = bool(candidate.gemini_api_key)
        preview = ""
        if has_key:
            k = candidate.gemini_api_key.strip()
            preview = f"{k[:6]}...{k[-4:]}" if len(k) > 10 else "••••••••"

        return Response({
            "has_key": has_key,
            "key_preview": preview,
            "model": "gemini-3.5-flash-lite",
            "status": "connected" if has_key else "not_configured",
        })

    def post(self, request):
        candidate = self._get_candidate(request)
        if not candidate:
            return Response({"detail": "Candidate profile required."}, status=status.HTTP_400_BAD_REQUEST)

        api_key = (request.data.get("api_key") or "").strip()
        if not api_key:
            return Response({"detail": "API key cannot be blank."}, status=status.HTTP_400_BAD_REQUEST)

        from apps.resumes.gemini_service import validate_gemini_key
        is_valid, msg = validate_gemini_key(api_key)
        if not is_valid:
            return Response({
                "detail": f"Gemini API validation failed: {msg}. Please ensure your key is active in Google AI Studio."
            }, status=status.HTTP_400_BAD_REQUEST)

        candidate.gemini_api_key = api_key
        candidate.save()

        preview = f"{api_key[:6]}...{api_key[-4:]}" if len(api_key) > 10 else "••••••••"
        return Response({
            "status": "connected",
            "message": "Google Gemini API key verified and connected successfully! AI features are now powered by Gemini 3.5 Flash-Lite.",
            "key_preview": preview,
            "model": "gemini-3.5-flash-lite",
        })

    def delete(self, request):
        candidate = self._get_candidate(request)
        if not candidate:
            return Response({"detail": "Candidate profile required."}, status=status.HTTP_400_BAD_REQUEST)

        candidate.gemini_api_key = ""
        candidate.save()
        return Response({
            "status": "disconnected",
            "message": "Gemini API key removed. AI features will use built-in engine.",
        })


class ForgotPasswordView(APIView):
    """
    Initiate password reset: receives email, generates a secure one-time token,
    and sends a branded reset link via Gmail SMTP.
    """
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        user = User.objects.filter(email__iexact=email).first()
        if user and user.is_active:
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173").rstrip("/")
            reset_url = f"{frontend_url}/reset-password/{uid}/{token}"

            subject = "CareerLens — Password Reset Request"
            valid_hours = int(getattr(settings, "PASSWORD_RESET_TIMEOUT", 86400) // 3600)
            context = {
                "user": user,
                "reset_url": reset_url,
                "valid_hours": valid_hours,
            }

            try:
                html_content = render_to_string("emails/password_reset_email.html", context)
            except Exception as e:
                logger.warning("Failed to render HTML email template: %s", e)
                html_content = None

            try:
                text_content = render_to_string("emails/password_reset_email.txt", context)
            except Exception:
                text_content = (
                    f"Hello {user.first_name or user.username},\n\n"
                    f"We received a request to reset your password for CareerLens.\n"
                    f"Please visit the following link to reset your password:\n\n"
                    f"{reset_url}\n\n"
                    f"This link expires in {valid_hours} hours. If you did not make this request, please ignore this email.\n\n"
                    f"— The CareerLens Team"
                )

            try:
                msg = EmailMultiAlternatives(
                    subject=subject,
                    body=text_content,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to=[user.email],
                )
                if html_content:
                    msg.attach_alternative(html_content, "text/html")
                msg.send(fail_silently=False)

                log_audit_action(
                    actor=user,
                    action="PASSWORD_RESET_REQUESTED",
                    target_type="User",
                    target_id=user.id,
                    details=f"Password reset link emailed to {user.email}"
                )
            except Exception as exc:
                logger.exception("Failed to send password reset email via SMTP: %s", exc)
                if settings.DEBUG:
                    return Response(
                        {
                            "detail": f"Failed to send email: {str(exc)}. Please check your EMAIL_HOST_USER and EMAIL_HOST_PASSWORD in backend/.env."
                        },
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    )
                return Response(
                    {"detail": "Unable to send password reset email at this moment. Please try again later."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        # Standard security practice: return identical friendly response to prevent email enumeration
        return Response(
            {"detail": "If an account with that email exists, a password reset link has been sent to your inbox."},
            status=status.HTTP_200_OK,
        )


class ResetPasswordView(APIView):
    """
    Complete password reset: verifies token, updates user password, and logs the security audit.
    """
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uid_b64 = serializer.validated_data["uid"]
        token = serializer.validated_data["token"]
        password = serializer.validated_data["password"]

        try:
            user_id = force_str(urlsafe_base64_decode(uid_b64))
            user = User.objects.get(pk=user_id)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {"detail": "This password reset link is invalid or has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not default_token_generator.check_token(user, token):
            return Response(
                {"detail": "This password reset link is invalid or has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(password)
        user.save()

        log_audit_action(
            actor=user,
            action="PASSWORD_RESET_COMPLETED",
            target_type="User",
            target_id=user.id,
            details=f"Password successfully reset for {user.username}"
        )

        return Response(
            {"detail": "Your password has been reset successfully. You can now log in with your new password."},
            status=status.HTTP_200_OK,
        )

