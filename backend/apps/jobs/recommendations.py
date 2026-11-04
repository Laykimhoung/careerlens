from apps.jobs.models import Job
from apps.jobs.serializers import JobSerializer


def calculate_job_recommendation(candidate, job, preferences=None):
    """
    Computes an explainable AI match score and breakdown between a candidate and a Job.
    Returns a dict adhering to the BestFitJobs.jsx frontend contract.
    """
    prefs = preferences or {}
    target_role = (prefs.get("target_role") or "").strip().lower()
    pref_location = (prefs.get("preferred_location") or "").strip().lower()
    pref_emp = (prefs.get("preferred_employment_type") or "").strip().upper()
    pref_workplace = (prefs.get("preferred_workplace_type") or "").strip().upper()

    # Required skills on Job
    job_skills_list = [js.skill.name for js in job.job_skills.all() if js.skill]
    req_skills_map = {s.lower(): s for s in job_skills_list}

    # Candidate skills & proficiencies
    candidate_skills = {}
    if candidate:
        for cs in candidate.skills.select_related("skill").all():
            if cs.skill:
                candidate_skills[cs.skill.name.lower()] = {
                    "name": cs.skill.name,
                    "proficiency": cs.proficiency,
                }

    # Identify matching and missing skills
    matching_skills = []
    missing_skills = []
    proficiency_bonus = 0

    for s_lower, s_orig in req_skills_map.items():
        if s_lower in candidate_skills:
            matching_skills.append(s_orig)
            cand_prof = candidate_skills[s_lower]["proficiency"]
            if cand_prof == "EXPERT":
                proficiency_bonus += 2
            elif cand_prof == "INTERMEDIATE":
                proficiency_bonus += 1
        else:
            missing_skills.append(s_orig)

    # 1. Skills Score (0 - 40)
    if job_skills_list:
        base_skill_ratio = len(matching_skills) / len(job_skills_list)
        skills_score = min(40, round(base_skill_ratio * 36) + min(4, proficiency_bonus))
    else:
        # If job has no skills explicitly listed, assume baseline match
        skills_score = 28

    # 2. Experience & Role Fit Score (0 - 25)
    # Evidenced by bio depth, graduation status, and target role alignment
    exp_score = 15
    if candidate:
        if candidate.bio and len(candidate.bio.strip()) > 30:
            exp_score += 5
        if candidate.graduation_year:
            exp_score += 3
        if target_role and (target_role in job.title.lower() or job.title.lower() in target_role):
            exp_score += 2
    experience_score = min(25, exp_score)

    # 3. Education Score (0 - 15)
    edu_score = 8
    if candidate:
        if candidate.university:
            edu_score += 4
        if candidate.major:
            edu_score += 3
    education_score = min(15, edu_score)

    # 4. Projects & Practical Evidence Score (0 - 10)
    proj_score = 5
    if candidate and candidate.resume_file:
        proj_score += 3
    if len(candidate_skills) >= 4:
        proj_score += 2
    projects_score = min(10, proj_score)

    # 5. Location & Preferences Score (0 - 10)
    pref_score = 4
    if pref_location:
        if pref_location == "any" or pref_location in (job.location or "").lower():
            pref_score += 2
    else:
        pref_score += 2

    if pref_emp:
        if job.employment_type == pref_emp:
            pref_score += 2
    else:
        pref_score += 2

    if pref_workplace:
        if job.workplace_type == pref_workplace:
            pref_score += 2
    else:
        pref_score += 2

    preferences_score = min(10, pref_score)

    # Total Match Score
    match_score = min(100, skills_score + experience_score + education_score + projects_score + preferences_score)

    # Human-readable Explanation
    company_name = job.company.company_name if job.company else "the hiring team"
    if matching_skills:
        top_matched = ", ".join(matching_skills[:3])
        explanation = (
            f"Your demonstrated proficiencies in {top_matched} align with {company_name}'s "
            f"requirements for {job.title}."
        )
        if candidate and candidate.major:
            explanation += f" Complemented by your academic foundation in {candidate.major}."
    else:
        explanation = (
            f"Your general qualifications and academic profile make you a promising candidate for "
            f"entry into {job.title} at {company_name}."
        )

    # Improvement Suggestions
    suggestions = []
    if missing_skills:
        top_missing = ", ".join(missing_skills[:2])
        suggestions.append(
            f"Highlight practical project work or self-directed coursework in {top_missing} on your CV."
        )
    if candidate and not candidate.resume_file:
        suggestions.append(
            "Upload your latest CV document in your Profile to verify your qualifications."
        )
    if target_role and target_role not in job.title.lower():
        suggestions.append(
            f"Tailor your profile bio to mention your interest in {job.title} responsibilities."
        )
    if len(suggestions) < 2:
        suggestions.append(
            f"Review the required stack for {company_name} and feature relevant GitHub repositories."
        )

    # Fit Verdict
    if match_score >= 80:
        fit_verdict = "Exceptional Match"
    elif match_score >= 65:
        fit_verdict = "Strong Match"
    elif match_score >= 50:
        fit_verdict = "Good Fit"
    else:
        fit_verdict = "Potential Match"

    gemini_key = getattr(candidate, "gemini_api_key", "")
    if gemini_key:
        from apps.resumes.gemini_service import gemini_recommend_job
        candidate_summary = {
            "university": candidate.university if candidate else "",
            "major": candidate.major if candidate else "",
            "skills": [s["name"] for s in candidate_skills.values()],
            "target_role": target_role,
        }
        job_summary = {
            "title": job.title,
            "company": company_name,
            "required_skills": job_skills_list,
            "location": job.location,
            "employment_type": job.employment_type,
        }
        g_rec = gemini_recommend_job(job_summary, candidate_summary, prefs, gemini_key)
        if g_rec and isinstance(g_rec, dict) and "match_score" in g_rec:
            g_rec["id"] = job.id
            g_rec["job"] = JobSerializer(job).data
            return g_rec

    job_data = JobSerializer(job).data

    return {
        "id": job.id,
        "job": job_data,
        "match_score": match_score,
        "score_breakdown": {
            "skills_score": skills_score,
            "skills_max": 40,
            "experience_score": experience_score,
            "experience_max": 25,
            "education_score": education_score,
            "education_max": 15,
            "projects_score": projects_score,
            "projects_max": 10,
            "preferences_score": preferences_score,
            "preferences_max": 10,
        },
        "matching_skills": matching_skills,
        "missing_skills": missing_skills,
        "explanation": explanation,
        "improvement_suggestions": suggestions,
        "fit_verdict": fit_verdict,
    }


def get_candidate_recommendations(candidate, preferences=None, search=None, min_score=None, location=None, employment_type=None, workplace_type=None):
    """
    Evaluates published jobs against a candidate's profile and preferences.
    Returns sorted list of recommendation objects.
    """
    qs = Job.objects.filter(status=Job.Status.PUBLISHED).select_related(
        "company__user"
    ).prefetch_related("job_skills__skill")

    if location and location.strip():
        qs = qs.filter(location__icontains=location.strip())
    if employment_type and employment_type.strip():
        qs = qs.filter(employment_type=employment_type.strip().upper())
    if workplace_type and workplace_type.strip():
        qs = qs.filter(workplace_type=workplace_type.strip().upper())

    results = []
    for job in list(qs):
        rec = calculate_job_recommendation(candidate, job, preferences=preferences)

        if search and search.strip():
            q = search.strip().lower()
            job_title = job.title.lower()
            comp_name = (job.company.company_name if job.company else "").lower()
            job_loc = (job.location or "").lower()
            skills_str = " ".join(s.lower() for s in rec["matching_skills"])
            if q not in job_title and q not in comp_name and q not in job_loc and q not in skills_str:
                continue

        if min_score is not None:
            try:
                min_s = int(min_score)
                if rec["match_score"] < min_s:
                    continue
            except (ValueError, TypeError):
                pass

        results.append(rec)

    # Sort descending by match score
    results.sort(key=lambda x: x["match_score"], reverse=True)
    return results

