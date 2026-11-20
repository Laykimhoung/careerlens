"""
Explainability and rationale generation module for CareerLens ML Engine.
Produces structured score breakdowns, skill alignment lists, and human-readable justifications
adhering strictly to the frontend BestFitJobs.jsx UI contract.
"""

from typing import Dict, List, Any


def generate_explanation_payload(
    candidate_skills: List[Dict[str, Any]],
    job_skills: List[Dict[str, Any]],
    job_title: str,
    company_name: str,
    candidate_major: str,
    calibrated_score: int,
    feature_dict: Dict[str, float],
    has_resume: bool = True,
    target_role: str = "",
) -> Dict[str, Any]:
    """
    Generates explainable rationale, skill alignment tags, and score breakdown meters.
    """
    cand_skill_map = {s["name"].lower(): s["name"] for s in candidate_skills if s.get("name")}
    
    matching_skills = []
    missing_skills = []

    for js in job_skills:
        s_name = js.get("name", "")
        if not s_name:
            continue
        is_req = js.get("is_required", True)
        if s_name.lower() in cand_skill_map:
            matching_skills.append(cand_skill_map[s_name.lower()])
        else:
            if is_req:
                missing_skills.append(s_name)

    # De-duplicate while preserving order
    matching_skills = list(dict.fromkeys(matching_skills))
    missing_skills = list(dict.fromkeys(missing_skills))

    # -------------------------------------------------------------
    # 1. Calibrated UI Score Breakdown (Summing to ~ calibrated_score)
    # -------------------------------------------------------------
    # Weights: Skills (40 max), Experience (25 max), Education (15 max), Projects (10 max), Preferences (10 max)
    sim_skills = feature_dict.get("sim_skills", 0.5)
    jaccard = feature_dict.get("skill_jaccard_ratio", 0.5)
    prof_score = feature_dict.get("proficiency_weighted_score", 0.5)
    skill_factor = (0.5 * jaccard) + (0.3 * prof_score) + (0.2 * sim_skills)
    skills_score = int(round(min(40, max(0, skill_factor * 40))))

    sim_exp = feature_dict.get("sim_experience", 0.5)
    exp_comp = feature_dict.get("experience_compatibility", 0.8)
    sim_title = feature_dict.get("sim_title_role", 0.5)
    exp_factor = (0.4 * sim_exp) + (0.3 * exp_comp) + (0.3 * sim_title)
    experience_score = int(round(min(25, max(0, exp_factor * 25))))

    edu_align = feature_dict.get("education_alignment", 0.8)
    education_score = int(round(min(15, max(0, edu_align * 15))))

    completeness = feature_dict.get("profile_completeness", 0.7)
    proj_factor = 0.5 if not has_resume else min(1.0, 0.6 + (0.4 * completeness))
    projects_score = int(round(min(10, max(0, proj_factor * 10))))

    loc_comp = feature_dict.get("location_compatibility", 1.0)
    wp_comp = feature_dict.get("workplace_compatibility", 1.0)
    emp_comp = feature_dict.get("employment_type_match", 1.0)
    pref_factor = (0.4 * loc_comp) + (0.3 * wp_comp) + (0.3 * emp_comp)
    preferences_score = int(round(min(10, max(0, pref_factor * 10))))

    # Calibrate sub-scores slightly to reflect the final ML prediction
    raw_sub_sum = skills_score + experience_score + education_score + projects_score + preferences_score
    if raw_sub_sum > 0 and calibrated_score > 0:
        scaling = calibrated_score / raw_sub_sum
        # Bound each meter
        skills_score = min(40, max(4, int(round(skills_score * scaling))))
        experience_score = min(25, max(3, int(round(experience_score * scaling))))
        education_score = min(15, max(2, int(round(education_score * scaling))))
        projects_score = min(10, max(2, int(round(projects_score * scaling))))
        preferences_score = min(10, max(2, int(round(preferences_score * scaling))))

    # -------------------------------------------------------------
    # 2. Human-Readable Justification
    # -------------------------------------------------------------
    c_name = company_name or "the hiring team"
    if matching_skills:
        top_matched = ", ".join(matching_skills[:3])
        explanation = (
            f"Your demonstrated proficiencies in {top_matched} strongly align with {c_name}'s "
            f"requirements for {job_title}."
        )
        if candidate_major:
            explanation += f" Complemented by your academic foundation in {candidate_major}."
    else:
        explanation = (
            f"Your broader academic background and foundational skill profile make you a promising candidate for "
            f"entry into {job_title} at {c_name}."
        )

    # -------------------------------------------------------------
    # 3. Actionable Improvement Suggestions
    # -------------------------------------------------------------
    suggestions = []
    if missing_skills:
        top_missing = ", ".join(missing_skills[:2])
        suggestions.append(
            f"Highlight practical project work or self-directed coursework in {top_missing} on your CV."
        )
    if not has_resume:
        suggestions.append(
            "Upload your latest CV document in your Profile to verify your qualifications."
        )
    if target_role and target_role.lower() not in job_title.lower():
        suggestions.append(
            f"Tailor your profile bio to highlight your interest in {job_title} responsibilities."
        )
    if len(suggestions) < 2:
        suggestions.append(
            f"Review the required stack for {c_name} and feature relevant GitHub repositories in your profile."
        )

    # -------------------------------------------------------------
    # 4. Fit Verdict Category
    # -------------------------------------------------------------
    if calibrated_score >= 80:
        fit_verdict = "Exceptional Match"
    elif calibrated_score >= 65:
        fit_verdict = "Strong Match"
    elif calibrated_score >= 50:
        fit_verdict = "Good Fit"
    else:
        fit_verdict = "Potential Match"

    return {
        "match_score": calibrated_score,
        "score_breakdown": {
            "skills_score": skills_score,
            "skills_max": 40,
            "skills": skills_score,
            "experience_score": experience_score,
            "experience_max": 25,
            "experience": experience_score,
            "education_score": education_score,
            "education_max": 15,
            "education": education_score,
            "projects_score": projects_score,
            "projects_max": 10,
            "projects": projects_score,
            "preferences_score": preferences_score,
            "preferences_max": 10,
            "preferences": preferences_score,
        },
        "matching_skills": matching_skills,
        "missing_skills": missing_skills,
        "explanation": explanation,
        "improvement_suggestions": suggestions,
        "fit_verdict": fit_verdict,
    }
