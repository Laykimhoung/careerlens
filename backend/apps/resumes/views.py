import io
from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.http import HttpResponse

from .models import Resume, ResumeVersion, CandidateUsage
from .serializers import ResumeSerializer, ResumeVersionSerializer, CandidateUsageSerializer
from .analysis import (
    parse_resume_content,
    analyze_resume_data,
    generate_cv_diagnosis,
    generate_cv_questionnaire,
    generate_improved_version_content,
)
from apps.accounts.models import CandidateProfile


def _resolve_candidate(request):
    if hasattr(request.user, "candidate_profile"):
        return request.user.candidate_profile
    if request.user.role == request.user.Role.CANDIDATE:
        profile, _ = CandidateProfile.objects.get_or_create(user=request.user)
        return profile
    if request.user.role == request.user.Role.ADMIN:
        cand_id = request.query_params.get("candidate_id") or (
            request.data.get("candidate_id") if isinstance(request.data, dict) else None
        )
        if cand_id:
            return CandidateProfile.objects.filter(id=cand_id).first()
        return CandidateProfile.objects.first()
    return None


def _get_or_create_usage(candidate):
    usage, _ = CandidateUsage.objects.get_or_create(
        candidate=candidate,
        defaults={"plan_tier": "FREE", "improvements_used": 0, "improvements_limit": 5},
    )
    return usage


class ResumeUploadView(APIView):
    """
    POST /api/resumes/upload/
    Uploads a CV file, parses structured sections, and runs initial analysis.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        candidate = _resolve_candidate(request)
        if not candidate:
            return Response({"detail": "Candidate profile required."}, status=status.HTTP_400_BAD_REQUEST)

        uploaded_file = request.FILES.get("file")
        if not uploaded_file:
            return Response({"file": ["Please select a file to upload."]}, status=status.HTTP_400_BAD_REQUEST)

        target_role = (request.data.get("target_role") or "").strip()
        parsed_data = parse_resume_content(uploaded_file.name, candidate, target_role=target_role)
        gemini_key = candidate.gemini_api_key or request.headers.get("X-Gemini-Api-Key")
        if gemini_key:
            from .gemini_service import gemini_analyze_cv
            g_analysis = gemini_analyze_cv(parsed_data, target_role=target_role, api_key=gemini_key)
            analysis_data = g_analysis if g_analysis else analyze_resume_data(parsed_data, target_role=target_role)
        else:
            analysis_data = analyze_resume_data(parsed_data, target_role=target_role)

        # Deactivate existing active resumes
        Resume.objects.filter(candidate=candidate).update(is_active=False)

        resume = Resume.objects.create(
            candidate=candidate,
            file=uploaded_file,
            file_name=uploaded_file.name,
            target_role=target_role,
            parsed_data=parsed_data,
            analysis=analysis_data,
            is_active=True,
        )

        candidate.resume_file = uploaded_file
        candidate.save()

        return Response(ResumeSerializer(resume).data, status=status.HTTP_201_CREATED)


class LatestResumeView(APIView):
    """
    GET /api/resumes/latest/
    Fetches candidate's active resume and latest analysis.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        candidate = _resolve_candidate(request)
        if not candidate:
            return Response({"detail": "No active resume found."}, status=status.HTTP_404_NOT_FOUND)

        resume = Resume.objects.filter(candidate=candidate, is_active=True).first()
        if not resume:
            resume = Resume.objects.filter(candidate=candidate).order_by("-created_at").first()

        if not resume:
            return Response({"detail": "No active resume found."}, status=status.HTTP_404_NOT_FOUND)

        return Response(ResumeSerializer(resume).data)


class ResumeDetailView(APIView):
    """
    GET /api/resumes/:id/
    DELETE /api/resumes/:id/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        candidate = _resolve_candidate(request)
        resume = get_object_or_404(Resume, id=pk, candidate=candidate)
        return Response(ResumeSerializer(resume).data)

    def delete(self, request, pk):
        candidate = _resolve_candidate(request)
        resume = get_object_or_404(Resume, id=pk, candidate=candidate)
        resume.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ResumeParsedDataView(APIView):
    """
    PATCH /api/resumes/:id/parsed-data/
    Saves candidate manual edits to extracted sections.
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        candidate = _resolve_candidate(request)
        resume = get_object_or_404(Resume, id=pk, candidate=candidate)

        data = request.data if isinstance(request.data, dict) else {}
        target_role = data.get("target_role")
        if target_role is not None:
            resume.target_role = target_role

        # Update parsed data payload
        parsed = dict(resume.parsed_data or {})
        for key in ["contact_info", "summary", "skills", "work_experience", "education", "projects", "certifications", "languages"]:
            if key in data:
                parsed[key] = data[key]

        resume.parsed_data = parsed
        resume.save()
        return Response(ResumeSerializer(resume).data)


class ResumeAnalyzeView(APIView):
    """
    POST /api/resumes/:id/analyze/
    Triggers quality scoring analysis out of 10.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        candidate = _resolve_candidate(request)
        resume = get_object_or_404(Resume, id=pk, candidate=candidate)

        target_role = request.data.get("target_role") or resume.target_role
        resume.target_role = target_role

        gemini_key = candidate.gemini_api_key or request.headers.get("X-Gemini-Api-Key")
        if gemini_key:
            from .gemini_service import gemini_analyze_cv
            g_analysis = gemini_analyze_cv(resume.parsed_data, target_role=target_role, api_key=gemini_key)
            analysis_data = g_analysis if g_analysis else analyze_resume_data(resume.parsed_data, target_role=target_role)
        else:
            analysis_data = analyze_resume_data(resume.parsed_data, target_role=target_role)
        resume.analysis = analysis_data
        resume.save()

        return Response(ResumeSerializer(resume).data)


class ImprovementDiagnosisView(APIView):
    """
    GET /api/resumes/improvement/diagnosis/
    Fetches weaknesses diagnosis & selectable improvement options using Prompt 2.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        candidate = _resolve_candidate(request)
        if not candidate:
            return Response({"detail": "Candidate profile required."}, status=status.HTTP_400_BAD_REQUEST)

        latest_resume = Resume.objects.filter(candidate=candidate, is_active=True).first()
        gemini_key = candidate.gemini_api_key or request.headers.get("X-Gemini-Api-Key")
        if gemini_key and latest_resume:
            from .gemini_service import gemini_diagnose_cv
            g_diag = gemini_diagnose_cv(latest_resume.parsed_data, latest_resume.target_role, gemini_key)
            if g_diag and isinstance(g_diag, dict) and "improvement_options" in g_diag:
                g_diag["target_role"] = latest_resume.target_role or "Software Developer"
                return Response(g_diag)

        diagnosis = generate_cv_diagnosis(candidate, latest_resume)
        return Response(diagnosis)


class ImprovementQuestionnaireView(APIView):
    """
    GET /api/resumes/improvement/questionnaire/
    Personalized missing-information questionnaire based on actual gaps using Prompt 2.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        candidate = _resolve_candidate(request)
        if not candidate:
            return Response({"detail": "Candidate profile required."}, status=status.HTTP_400_BAD_REQUEST)

        latest_resume = Resume.objects.filter(candidate=candidate, is_active=True).first()
        gemini_key = candidate.gemini_api_key or request.headers.get("X-Gemini-Api-Key")
        if gemini_key and latest_resume:
            from .gemini_service import gemini_diagnose_cv
            g_diag = gemini_diagnose_cv(latest_resume.parsed_data, latest_resume.target_role, gemini_key)
            if g_diag and isinstance(g_diag, dict) and "questions" in g_diag:
                return Response({"questions": g_diag["questions"]})

        questionnaire = generate_cv_questionnaire(candidate, latest_resume)
        return Response(questionnaire)


class ImprovementGenerateView(APIView):
    """
    POST /api/resumes/improvement/generate/
    Generates improved CV version, deducting 1 credit from quota.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        candidate = _resolve_candidate(request)
        if not candidate:
            return Response({"detail": "Candidate profile required."}, status=status.HTTP_400_BAD_REQUEST)

        usage = _get_or_create_usage(candidate)

        data = request.data if isinstance(request.data, dict) else {}
        options = data.get("selected_improvements", [])
        answers = data.get("questionnaire_answers", {})
        template = data.get("template", "modern")
        target_role = data.get("target_role", "")

        latest_resume = Resume.objects.filter(candidate=candidate, is_active=True).first()
        gemini_key = candidate.gemini_api_key or request.headers.get("X-Gemini-Api-Key")
        if gemini_key:
            from .gemini_service import gemini_improve_cv
            curr_data = latest_resume.parsed_data if latest_resume else {}
            g_content, g_reanalysis = gemini_improve_cv(curr_data, target_role, answers, options, gemini_key)
            if g_content and g_reanalysis:
                improved_content, reanalysis = g_content, g_reanalysis
            else:
                improved_content, reanalysis = generate_improved_version_content(
                    candidate=candidate, latest_resume=latest_resume, options=options, answers=answers, template=template, target_role=target_role
                )
        else:
            improved_content, reanalysis = generate_improved_version_content(
                candidate=candidate, latest_resume=latest_resume, options=options, answers=answers, template=template, target_role=target_role
            )

        # Determine next version number
        count = ResumeVersion.objects.filter(candidate=candidate).count()
        next_ver = count + 1

        # Unmark current
        ResumeVersion.objects.filter(candidate=candidate).update(is_current=False)

        role_label = target_role or "Professional"
        version_obj = ResumeVersion.objects.create(
            candidate=candidate,
            version_number=next_ver,
            title=f"AI Optimized {role_label} CV",
            template=template,
            content=improved_content,
            is_current=True,
            is_approved=False,
            reanalysis_data=reanalysis,
        )

        usage.improvements_used += 1
        usage.save()

        return Response({
            "status": "success",
            "message": "AI-improved CV draft created successfully.",
            "version": ResumeVersionSerializer(version_obj).data,
        }, status=status.HTTP_201_CREATED)


class ResumeVersionsListView(APIView):
    """
    GET /api/resumes/improvement/versions/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        candidate = _resolve_candidate(request)
        if not candidate:
            return Response([])

        versions = ResumeVersion.objects.filter(candidate=candidate).order_by("-version_number")
        return Response(ResumeVersionSerializer(versions, many=True).data)


class ResumeVersionDetailView(APIView):
    """
    GET, PATCH, DELETE /api/resumes/improvement/versions/:id/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        candidate = _resolve_candidate(request)
        version = get_object_or_404(ResumeVersion, id=pk, candidate=candidate)
        return Response(ResumeVersionSerializer(version).data)

    def patch(self, request, pk):
        candidate = _resolve_candidate(request)
        version = get_object_or_404(ResumeVersion, id=pk, candidate=candidate)

        data = request.data if isinstance(request.data, dict) else {}
        if "title" in data:
            version.title = data["title"]
        if "template" in data:
            version.template = data["template"]
        if "content" in data:
            version.content = data["content"]

        version.save()
        return Response(ResumeVersionSerializer(version).data)

    def delete(self, request, pk):
        candidate = _resolve_candidate(request)
        version = get_object_or_404(ResumeVersion, id=pk, candidate=candidate)
        version.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ApproveResumeVersionView(APIView):
    """
    POST /api/resumes/improvement/versions/:id/approve/
    Candidate approves this version as their active CV.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        candidate = _resolve_candidate(request)
        version = get_object_or_404(ResumeVersion, id=pk, candidate=candidate)

        ResumeVersion.objects.filter(candidate=candidate).update(is_approved=False, is_current=False)
        version.is_approved = True
        version.is_current = True
        version.save()

        # Update candidate's active Resume with the approved content
        active_resume = Resume.objects.filter(candidate=candidate, is_active=True).first()
        if active_resume:
            active_resume.parsed_data = version.content
            active_resume.analysis = version.reanalysis_data
            active_resume.save()

        return Response({
            "status": "success",
            "message": f"Version {version.version_number} is now your active approved CV!",
            "version": ResumeVersionSerializer(version).data,
        })


class ReanalyzeResumeVersionView(APIView):
    """
    POST /api/resumes/improvement/versions/:id/reanalyze/
    Re-evaluates the version with scoring rubric.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        candidate = _resolve_candidate(request)
        version = get_object_or_404(ResumeVersion, id=pk, candidate=candidate)

        reanalysis = analyze_resume_data(version.content)
        version.reanalysis_data = reanalysis
        version.save()

        return Response({
            "status": "success",
            "version": ResumeVersionSerializer(version).data,
        })


class RestoreResumeVersionView(APIView):
    """
    POST /api/resumes/improvement/versions/:id/restore/
    Restores historical version as a new editable draft without consuming credits.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        candidate = _resolve_candidate(request)
        version = get_object_or_404(ResumeVersion, id=pk, candidate=candidate)

        count = ResumeVersion.objects.filter(candidate=candidate).count()
        next_ver = count + 1

        ResumeVersion.objects.filter(candidate=candidate).update(is_current=False)
        new_version = ResumeVersion.objects.create(
            candidate=candidate,
            version_number=next_ver,
            title=f"Restored from v{version.version_number} ({version.title})",
            template=version.template,
            content=dict(version.content),
            is_current=True,
            is_approved=False,
            reanalysis_data=dict(version.reanalysis_data),
        )

        return Response({
            "status": "success",
            "message": f"Version {version.version_number} restored as new draft v{next_ver}!",
            "version": ResumeVersionSerializer(new_version).data,
        })


class ExportDocxResumeView(APIView):
    """
    GET /api/resumes/improvement/versions/:id/export-docx/
    Returns a downloadable Word-compatible document representation.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        candidate = _resolve_candidate(request)
        version = get_object_or_404(ResumeVersion, id=pk, candidate=candidate)
        content = version.content or {}

        contact = content.get("contact_info", {})
        summary = content.get("summary", "")
        skills = content.get("skills", {})
        tech_skills = ", ".join(skills.get("technical", [])) if isinstance(skills, dict) else ""
        soft_skills = ", ".join(skills.get("soft", [])) if isinstance(skills, dict) else ""
        work = content.get("work_experience", [])
        edu = content.get("education", [])
        proj = content.get("projects", [])

        # Build clean structured text representation
        lines = [
            f"# {contact.get('name', 'Candidate CV')}",
            f"{contact.get('email', '')} | {contact.get('phone', '')} | {contact.get('location', '')}",
            f"{contact.get('linkedin', '')} | {contact.get('website', '')}",
            "",
            "## PROFESSIONAL SUMMARY",
            summary,
            "",
            "## TECHNICAL & CORE COMPETENCIES",
            f"Technical Skills: {tech_skills}",
            f"Soft Skills: {soft_skills}",
            "",
            "## WORK EXPERIENCE",
        ]

        for w in work:
            lines.append(f"### {w.get('title', '')} - {w.get('company', '')} ({w.get('start_date', '')} to {w.get('end_date', 'Present')})")
            for b in w.get("bullet_points", []):
                lines.append(f"- {b}")
            lines.append("")

        lines.append("## EDUCATION")
        for e in edu:
            lines.append(f"- {e.get('degree', '')} in {e.get('major', '')}, {e.get('institution', '')} ({e.get('graduation_year', '')})")
            if e.get("details"):
                lines.append(f"  {e.get('details')}")

        lines.append("")
        lines.append("## KEY PROJECTS")
        for p in proj:
            lines.append(f"### {p.get('title', '')}")
            lines.append(f"{p.get('description', '')}")
            if p.get("technologies"):
                lines.append(f"Technologies: {p.get('technologies')}")
            for b in p.get("bullet_points", []):
                lines.append(f"- {b}")
            lines.append("")

        output = "\n".join(lines).encode("utf-8")
        response = HttpResponse(output, content_type="text/markdown; charset=utf-8")
        response["Content-Disposition"] = f'attachment; filename="CV_v{version.version_number}.txt"'
        return response


class UsageSummaryView(APIView):
    """
    GET /api/resumes/usage/
    POST /api/resumes/usage/upgrade/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        candidate = _resolve_candidate(request)
        if not candidate:
            return Response({"plan_tier": "FREE", "improvements_used": 0, "improvements_limit": 5, "improvements_remaining": 5})

        usage = _get_or_create_usage(candidate)
        return Response(CandidateUsageSerializer(usage).data)

    def post(self, request):
        candidate = _resolve_candidate(request)
        if not candidate:
            return Response({"detail": "Candidate profile required."}, status=status.HTTP_400_BAD_REQUEST)

        usage = _get_or_create_usage(candidate)
        action = request.data.get("action", "upgrade")
        if action == "upgrade":
            usage.plan_tier = "PREMIUM"
            usage.improvements_limit = 50
        else:
            usage.plan_tier = "FREE"
            usage.improvements_limit = 5

        usage.save()
        return Response({
            "status": "success",
            "message": f"Plan updated to {usage.plan_tier}!",
            "usage": CandidateUsageSerializer(usage).data,
        })

