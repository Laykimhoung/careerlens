def calculate_candidate_ranking(job, application):
    """
    Computes an explainable match evaluation between a Job and a candidate's Application.
    Returns the exact data structure expected by Company CandidateRanking.jsx.
    """
    candidate = application.candidate
    candidate_user = candidate.user if candidate else None

    # Job requirements
    required_skills = [js.skill.name for js in job.job_skills.all() if js.skill]
    req_skills_lower = {s.lower(): s for s in required_skills}

    # Candidate skills & proficiencies
    candidate_skills_map = {}
    if candidate:
        for cs in candidate.skills.select_related("skill").all():
            if cs.skill:
                candidate_skills_map[cs.skill.name.lower()] = {
                    "name": cs.skill.name,
                    "proficiency": cs.proficiency,
                }

    # Skill intersection
    matching_required = []
    missing_required = []
    for s_lower, s_orig in req_skills_lower.items():
        if s_lower in candidate_skills_map:
            matching_required.append(s_orig)
        else:
            missing_required.append(s_orig)

    # Calculate skill score (0 to 40)
    if required_skills:
        skill_ratio = len(matching_required) / len(required_skills)
        skills_score = round(skill_ratio * 40)
    else:
        skill_ratio = 0.75
        skills_score = 30

    # Experience score (0 to 25)
    # Evidence from cover letter and profile bio
    has_cover = bool(application.cover_letter and len(application.cover_letter.strip()) > 20)
    has_bio = bool(candidate and candidate.bio and len(candidate.bio.strip()) > 10)
    experience_score = 25 if (has_cover and has_bio) else (20 if (has_cover or has_bio) else 15)

    # Education score (0 to 15)
    has_uni = bool(candidate and candidate.university)
    has_major = bool(candidate and candidate.major)
    education_score = 15 if (has_uni and has_major) else (12 if (has_uni or has_major) else 8)

    # Projects score (0 to 15)
    # Evidenced by skill depth or attached resume file
    has_resume = bool(application.resume_file or (candidate and candidate.resume_file))
    projects_score = 15 if (has_resume and len(candidate_skills_map) >= 3) else (12 if has_resume else 10)

    # Certifications / credentials score (0 to 5)
    certifications_score = 5 if len(candidate_skills_map) >= 5 else 4

    # Total Match Score (0 to 100%)
    total_score = min(100, skills_score + experience_score + education_score + projects_score + certifications_score)

    # Profile Completeness (0 to 100%)
    completeness_parts = [
        bool(candidate and candidate.university),
        bool(candidate and candidate.major),
        bool(candidate and candidate.bio),
        bool(candidate_skills_map),
        has_resume,
    ]
    completeness = round((sum(completeness_parts) / len(completeness_parts)) * 100)

    # Explainability: Strengths
    strengths = []
    if matching_required:
        strengths.append(f"Demonstrated skills matching required stack: {', '.join(matching_required[:3])}.")
    if candidate and candidate.major:
        strengths.append(f"Relevant academic focus in {candidate.major}.")
    if has_resume:
        strengths.append("Verified resume document submitted with application.")
    if not strengths:
        strengths.append("Eager candidate with foundational qualifications.")

    # Explainability: Areas for Review / Clarification
    areas_for_review = []
    if missing_required:
        areas_for_review.append(f"Unverified experience in: {', '.join(missing_required[:3])}.")
    if not has_cover:
        areas_for_review.append("No tailored cover letter provided for this vacancy.")
    if not areas_for_review:
        areas_for_review.append("Verify specific project timeline and availability.")

    # Suggested tailored interview questions
    questions = []
    if missing_required:
        questions.append(f"How would you approach ramping up on {missing_required[0]} in your first month?")
    if matching_required:
        questions.append(f"Can you walk us through a challenging technical problem you solved using {matching_required[0]}?")
    questions.append("What aspects of our company's mission and engineering culture resonate most with you?")

    # Fit Verdict
    if total_score >= 80:
        fit_verdict = "Strong Match (Top Tier)"
    elif total_score >= 60:
        fit_verdict = "Good Match"
    elif total_score >= 40:
        fit_verdict = "Moderate Match"
    else:
        fit_verdict = "Low Match / Needs Review"

    explanation = (
        f"Match score of {total_score}% calculated based on {len(matching_required)} matching skills "
        f"out of {len(required_skills) if required_skills else 'general'} requirements, "
        f"profile completeness ({completeness}%), and academic relevance."
    )

    candidate_skills_list = [
        {"id": cs.skill.id, "name": cs.skill.name, "proficiency": cs.proficiency}
        for cs in (candidate.skills.select_related("skill").all() if candidate else [])
        if cs.skill
    ]

    resume_url = ""
    if application.resume_file:
        resume_url = application.resume_file.url
    elif candidate and candidate.resume_file:
        resume_url = candidate.resume_file.url

    # Format notes & interviews
    notes_list = [
        {
            "id": n.id,
            "note": n.note,
            "author_name": (
                f"{n.author.first_name} {n.author.last_name}".strip() or n.author.username
                if n.author
                else "Recruiter"
            ),
            "created_at": n.created_at.isoformat(),
        }
        for n in application.notes.select_related("author").all().order_by("-created_at")
    ]

    interviews_list = [
        {
            "id": i.id,
            "scheduled_at": i.scheduled_at.isoformat(),
            "location": i.location,
            "meeting_link": i.meeting_link,
            "status": i.status,
            "feedback": i.feedback,
        }
        for i in application.interviews.all().order_by("-scheduled_at")
    ]

    return {
        "id": application.id,
        "status": application.status,
        "applied_at": application.applied_at.isoformat() if application.applied_at else "",
        "cover_letter": application.cover_letter or "",
        "resume_url": resume_url,
        "notes": notes_list,
        "interviews": interviews_list,
        "candidate_details": {
            "id": candidate.id if candidate else None,
            "user": {
                "id": candidate_user.id if candidate_user else None,
                "username": candidate_user.username if candidate_user else "",
                "first_name": candidate_user.first_name if candidate_user else "",
                "last_name": candidate_user.last_name if candidate_user else "",
                "email": candidate_user.email if candidate_user else "",
            },
            "university": candidate.university if candidate else "",
            "major": candidate.major if candidate else "",
            "graduation_year": candidate.graduation_year if candidate else None,
            "bio": candidate.bio if candidate else "",
            "skills": candidate_skills_list,
        },
        "ranking": {
            "match_score": total_score,
            "fit_verdict": fit_verdict,
            "explanation": explanation,
            "strengths": strengths,
            "areas_for_review": areas_for_review,
            "suggested_interview_questions": questions,
            "score_breakdown": {
                "skills": skills_score,
                "experience": experience_score,
                "education": education_score,
                "projects": projects_score,
                "certifications": certifications_score,
                "completeness": completeness,
                "matching_required_skills": matching_required,
                "missing_required_skills": missing_required,
                "matching_preferred_skills": [],
                "missing_preferred_skills": [],
            },
        },
    }

