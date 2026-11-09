from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from .models import Job, Skill, JobSkill, SavedJob, CandidateJobMatchCache
from .serializers import JobSerializer, SkillSerializer, JobSkillSerializer, SavedJobSerializer
from .permissions import IsJobOwnerOrReadOnly
from .services import filter_jobs
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
        search = self.request.query_params.get("search")
        location = self.request.query_params.get("location")
        if search or location:
            qs = filter_jobs(qs, search=search, location=location, exclude_expired=False)
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
        if not hasattr(self.request.user, 'candidate_profile'):
            from apps.accounts.models import CandidateProfile
            CandidateProfile.objects.get_or_create(user=self.request.user)
        return (
            SavedJob.objects.select_related('job__company__user')
            .prefetch_related('job__job_skills__skill')
            .filter(candidate=self.request.user.candidate_profile)
            .order_by('-created_at')
        )

    def perform_create(self, serializer):
        from django.db import IntegrityError, transaction
        from rest_framework import serializers as drf_serializers
        from apps.accounts.models import CandidateProfile
        if not hasattr(self.request.user, 'candidate_profile'):
            CandidateProfile.objects.get_or_create(user=self.request.user)
        job = serializer.validated_data.get('job')
        if SavedJob.objects.filter(candidate=self.request.user.candidate_profile, job=job).exists():
            raise drf_serializers.ValidationError({"detail": "Job is already saved."})
        try:
            with transaction.atomic():
                serializer.save(candidate=self.request.user.candidate_profile)
        except IntegrityError:
            raise drf_serializers.ValidationError({"detail": "Job is already saved."})


class PlatformStatsView(APIView):
    """
    Public endpoint returning real-time platform metrics from the database:
    students, registered companies, published jobs, and connection applications.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from apps.accounts.models import CandidateProfile, CompanyProfile
        from apps.applications.models import Application

        students_count = CandidateProfile.objects.count()
        companies_count = CompanyProfile.objects.count()
        published_jobs = Job.objects.filter(status=Job.Status.PUBLISHED).count()
        jobs_count = published_jobs if published_jobs > 0 else Job.objects.count()
        connections_count = Application.objects.count()

        return Response({
            "students": students_count,
            "companies": companies_count,
            "jobs": jobs_count,
            "connections": connections_count,
        })


from .recommendations import get_candidate_recommendations


class JobRecommendationView(APIView):
    """
    Candidate AI job recommendations based on skills, profile, and career preferences.
    """
    permission_classes = [permissions.IsAuthenticated]

    def _resolve_candidate(self, request):
        if hasattr(request.user, "candidate_profile"):
            return request.user.candidate_profile
        if request.user.role == request.user.Role.ADMIN:
            cand_id = request.query_params.get("candidate_id") or (request.data.get("candidate_id") if isinstance(request.data, dict) else None)
            if cand_id:
                return CandidateProfile.objects.filter(id=cand_id).first()
            return CandidateProfile.objects.first()
        return None

    def get(self, request):
        candidate = self._resolve_candidate(request)
        if not candidate and request.user.role == request.user.Role.COMPANY:
            return Response({
                "detail": "Job recommendations are designed for candidates. Switch to a candidate account to view personalized matches."
            }, status=status.HTTP_400_BAD_REQUEST)

        force_refresh = str(request.query_params.get("refresh", "")).lower() in ("true", "1", "yes")

        # Check if candidate has persisted job match results in PostgreSQL database
        cache = CandidateJobMatchCache.objects.filter(candidate=candidate).first() if candidate else None

        if cache and cache.results and not force_refresh:
            return Response({
                "count": len(cache.results),
                "top_score": cache.top_score,
                "target_role": cache.target_role or (candidate.major if candidate else ""),
                "preferred_location": cache.preferred_location,
                "preferred_employment_type": cache.preferred_employment_type,
                "preferred_workplace_type": cache.preferred_workplace_type,
                "results": cache.results,
                "from_database": True,
                "last_scanned_at": cache.updated_at.isoformat() if cache.updated_at else None,
            })

        preferences = {
            "target_role": request.query_params.get("target_role", ""),
            "preferred_location": request.query_params.get("location", ""),
            "preferred_employment_type": request.query_params.get("employment_type", ""),
            "preferred_workplace_type": request.query_params.get("workplace_type", ""),
        }

        results = get_candidate_recommendations(
            candidate=candidate,
            preferences=preferences,
            search=request.query_params.get("search"),
            min_score=request.query_params.get("min_score"),
            location=request.query_params.get("location"),
            employment_type=request.query_params.get("employment_type"),
            workplace_type=request.query_params.get("workplace_type"),
        )

        top_score = results[0]["match_score"] if results else 0
        target_role = preferences["target_role"] or (candidate.major if candidate else "")

        # Persist results in PostgreSQL database for instant retrieval on any device
        if candidate:
            CandidateJobMatchCache.objects.update_or_create(
                candidate=candidate,
                defaults={
                    "results": results,
                    "top_score": top_score,
                    "target_role": target_role,
                    "preferred_location": preferences["preferred_location"],
                    "preferred_employment_type": preferences["preferred_employment_type"],
                    "preferred_workplace_type": preferences["preferred_workplace_type"],
                }
            )

        return Response({
            "count": len(results),
            "top_score": top_score,
            "target_role": target_role,
            "preferred_location": preferences["preferred_location"],
            "preferred_employment_type": preferences["preferred_employment_type"],
            "preferred_workplace_type": preferences["preferred_workplace_type"],
            "results": results,
            "from_database": False,
        })

    def post(self, request):
        candidate = self._resolve_candidate(request)
        if not candidate and request.user.role == request.user.Role.COMPANY:
            return Response({
                "detail": "Job recommendations are designed for candidates."
            }, status=status.HTTP_400_BAD_REQUEST)

        data = request.data if isinstance(request.data, dict) else {}
        preferences = {
            "target_role": data.get("target_role", ""),
            "preferred_location": data.get("preferred_location", ""),
            "preferred_employment_type": data.get("preferred_employment_type", ""),
            "preferred_workplace_type": data.get("preferred_workplace_type", ""),
        }

        results = get_candidate_recommendations(
            candidate=candidate,
            preferences=preferences,
            search=data.get("search"),
            min_score=data.get("min_score"),
            location=preferences["preferred_location"],
            employment_type=preferences["preferred_employment_type"],
            workplace_type=preferences["preferred_workplace_type"],
        )

        top_score = results[0]["match_score"] if results else 0
        target_role = preferences["target_role"] or (candidate.major if candidate else "")

        # Persist recalculated results in database
        if candidate:
            CandidateJobMatchCache.objects.update_or_create(
                candidate=candidate,
                defaults={
                    "results": results,
                    "top_score": top_score,
                    "target_role": target_role,
                    "preferred_location": preferences["preferred_location"],
                    "preferred_employment_type": preferences["preferred_employment_type"],
                    "preferred_workplace_type": preferences["preferred_workplace_type"],
                }
            )

        return Response({
            "count": len(results),
            "top_score": top_score,
            "target_role": target_role,
            "preferred_location": preferences["preferred_location"],
            "preferred_employment_type": preferences["preferred_employment_type"],
            "preferred_workplace_type": preferences["preferred_workplace_type"],
            "results": results,
            "from_database": True,
        })
