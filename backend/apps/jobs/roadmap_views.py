from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Job, Skill, CandidateRoadmap
from apps.accounts.models import CandidateProfile, CandidateSkill
from .roadmap import (
    POPULAR_ROLES,
    build_roadmap_dict,
    recalculate_roadmap_metrics,
)


def _resolve_candidate(request):
    if hasattr(request.user, "candidate_profile"):
        return request.user.candidate_profile
    if request.user.role == request.user.Role.ADMIN:
        cand_id = request.query_params.get("candidate_id") or (
            request.data.get("candidate_id") if isinstance(request.data, dict) else None
        )
        if cand_id:
            return CandidateProfile.objects.filter(id=cand_id).first()
        return CandidateProfile.objects.first()
    return None


class RoadmapOptionsView(APIView):
    """
    Returns popular target career roles and available published job listings.
    Used by the Career Target Configuration modal.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        jobs = Job.objects.filter(status=Job.Status.PUBLISHED).select_related("company").order_by("-created_at")[:50]
        available_jobs = [
            {
                "id": j.id,
                "title": j.title,
                "company_name": j.company.company_name if j.company else "Company",
                "location": j.location or "Cambodia",
                "employment_type": j.employment_type,
            }
            for j in jobs
        ]
        return Response({
            "popular_roles": POPULAR_ROLES,
            "available_jobs": available_jobs,
        })


class CareerRoadmapView(APIView):
    """
    Retrieves the candidate's active staged learning roadmap.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        candidate = _resolve_candidate(request)
        if not candidate:
            return Response({"has_roadmap": False, "roadmap": None})

        try:
            roadmap_obj = CandidateRoadmap.objects.select_related("target_job").get(candidate=candidate)
            return Response({
                "has_roadmap": True,
                "roadmap": roadmap_obj.roadmap_data,
            })
        except CandidateRoadmap.DoesNotExist:
            return Response({"has_roadmap": False, "roadmap": None})


class GenerateRoadmapView(APIView):
    """
    Generates or switches a staged learning roadmap for the candidate.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        candidate = _resolve_candidate(request)
        if not candidate:
            return Response(
                {"detail": "Candidate profile required to generate a career roadmap."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        target_role = (request.data.get("target_role") or "").strip()
        target_job_id = request.data.get("target_job_id")
        weekly_hours = request.data.get("weekly_hours", 10)

        target_job = None
        if target_job_id:
            try:
                target_job = Job.objects.select_related("company").prefetch_related("job_skills__skill").get(id=target_job_id)
                if not target_role:
                    target_role = target_job.title
            except Job.DoesNotExist:
                pass

        if not target_role and not target_job:
            return Response(
                {"detail": "Please specify a target role or select a job listing."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            weekly_hours = int(weekly_hours)
        except (ValueError, TypeError):
            weekly_hours = 10

        roadmap_data = build_roadmap_dict(
            candidate=candidate,
            target_role=target_role,
            target_job=target_job,
            weekly_hours=weekly_hours,
        )

        roadmap_obj, _ = CandidateRoadmap.objects.update_or_create(
            candidate=candidate,
            defaults={
                "target_role": target_role,
                "target_job": target_job,
                "weekly_hours": weekly_hours,
                "roadmap_data": roadmap_data,
            },
        )

        return Response({
            "status": "success",
            "message": "Career roadmap generated successfully.",
            "roadmap": roadmap_obj.roadmap_data,
        })


class UpdateMilestoneView(APIView):
    """
    Updates a milestone's status or candidate personal notes.
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        candidate = _resolve_candidate(request)
        if not candidate:
            return Response({"detail": "Candidate profile required."}, status=status.HTTP_400_BAD_REQUEST)

        roadmap_obj = CandidateRoadmap.objects.filter(candidate=candidate).first()
        if not roadmap_obj:
            return Response({"detail": "No active roadmap found."}, status=status.HTTP_404_NOT_FOUND)

        stage_id = request.data.get("stage_id")
        milestone_id = request.data.get("milestone_id")
        new_status = request.data.get("status")
        notes = request.data.get("notes")

        stages = roadmap_obj.roadmap_data.get("stages", [])
        for stage in stages:
            if stage.get("id") == stage_id or stage_id is None:
                for milestone in stage.get("milestones", []):
                    if milestone.get("id") == milestone_id:
                        if new_status is not None:
                            milestone["status"] = new_status
                        if notes is not None:
                            milestone["notes"] = notes
                        break

        recalculated = recalculate_roadmap_metrics(roadmap_obj.roadmap_data, candidate)
        roadmap_obj.roadmap_data = recalculated
        roadmap_obj.save()

        return Response({
            "status": "success",
            "roadmap": roadmap_obj.roadmap_data,
        })


class UpdateSkillStatusView(APIView):
    """
    Updates the candidate's personal assessment of a skill in the gap list.
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        candidate = _resolve_candidate(request)
        if not candidate:
            return Response({"detail": "Candidate profile required."}, status=status.HTTP_400_BAD_REQUEST)

        roadmap_obj = CandidateRoadmap.objects.filter(candidate=candidate).first()
        if not roadmap_obj:
            return Response({"detail": "No active roadmap found."}, status=status.HTTP_404_NOT_FOUND)

        skill_name = (request.data.get("skill_name") or "").strip().lower()
        new_status = request.data.get("status")

        missing_skills = roadmap_obj.roadmap_data.get("missing_skills", [])
        for skill in missing_skills:
            if skill.get("name", "").lower() == skill_name:
                skill["status"] = new_status
                break

        recalculated = recalculate_roadmap_metrics(roadmap_obj.roadmap_data, candidate)
        roadmap_obj.roadmap_data = recalculated
        roadmap_obj.save()

        return Response({
            "status": "success",
            "roadmap": roadmap_obj.roadmap_data,
        })


class SyncSkillToProfileView(APIView):
    """
    Adds a learned/verified skill directly into CandidateProfile.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        candidate = _resolve_candidate(request)
        if not candidate:
            return Response({"detail": "Candidate profile required."}, status=status.HTTP_400_BAD_REQUEST)

        skill_name = (request.data.get("skill_name") or "").strip()
        proficiency = request.data.get("proficiency", "INTERMEDIATE").upper()
        if proficiency not in ["BEGINNER", "INTERMEDIATE", "EXPERT"]:
            proficiency = "INTERMEDIATE"

        if not skill_name:
            return Response({"detail": "Skill name is required."}, status=status.HTTP_400_BAD_REQUEST)

        skill_obj, _ = Skill.objects.get_or_create(name__iexact=skill_name, defaults={"name": skill_name})
        CandidateSkill.objects.update_or_create(
            candidate=candidate,
            skill=skill_obj,
            defaults={"proficiency": proficiency},
        )

        # Update active roadmap if one exists
        roadmap_obj = CandidateRoadmap.objects.filter(candidate=candidate).first()
        if roadmap_obj:
            recalculated = recalculate_roadmap_metrics(roadmap_obj.roadmap_data, candidate)
            roadmap_obj.roadmap_data = recalculated
            roadmap_obj.save()

        return Response({
            "status": "success",
            "message": f"Skill '{skill_obj.name}' ({proficiency}) added to your verified profile!",
        })


class RecalculateRoadmapView(APIView):
    """
    Recalculates roadmap readiness against the candidate's latest profile and CV skills.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        candidate = _resolve_candidate(request)
        if not candidate:
            return Response({"detail": "Candidate profile required."}, status=status.HTTP_400_BAD_REQUEST)

        roadmap_obj = CandidateRoadmap.objects.filter(candidate=candidate).first()
        if not roadmap_obj:
            return Response({"detail": "No active roadmap found."}, status=status.HTTP_404_NOT_FOUND)

        recalculated = recalculate_roadmap_metrics(roadmap_obj.roadmap_data, candidate)
        roadmap_obj.roadmap_data = recalculated
        roadmap_obj.save()

        return Response({
            "status": "success",
            "roadmap": roadmap_obj.roadmap_data,
        })

