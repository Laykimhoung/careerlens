"""
Structured and semantic feature extraction module for CareerLens ML Engine.
Transforms candidate profile and job vacancy attributes into a standardized numerical feature vector.
"""

from typing import Dict, List, Any, Tuple, Optional
import numpy as np

from .normalizer import normalize_skill_name, normalize_skill_set, clean_text
from .embedder import get_embedder


FEATURE_NAMES = [
    "sim_skills",                 # 1. Semantic similarity of skills lists
    "sim_experience",             # 2. Semantic similarity of bio/resume vs job description
    "sim_title_role",             # 3. Semantic similarity of target role vs job title
    "sim_combined_doc",           # 4. Global unified document semantic similarity
    "skill_jaccard_ratio",        # 5. Proportion of required skills satisfied by candidate
    "proficiency_weighted_score", # 6. Coverage weighted by proficiency (Expert=1.0, Inter=0.7, Beg=0.4)
    "missing_required_ratio",     # 7. Fraction of required skills missing
    "missing_required_count",     # 8. Normalized count of missing required skills
    "preferred_skills_ratio",     # 9. Satisfaction of optional/preferred skills
    "location_compatibility",     # 10. Geographic alignment (1.0 = match/any, 0.0 = conflict)
    "workplace_compatibility",    # 11. Setup alignment (On-site, Hybrid, Remote)
    "employment_type_match",      # 12. Contract/Full-time/Part-time/Internship alignment
    "experience_compatibility",   # 13. Graduation year / experience vs job min experience
    "education_alignment",        # 14. University accreditation & major presence
    "profile_completeness",       # 15. Candidate profile depth & evidence completeness
]


PROFICIENCY_WEIGHTS = {
    "EXPERT": 1.0,
    "INTERMEDIATE": 0.7,
    "BEGINNER": 0.4,
}


def extract_features_from_dict(
    candidate_data: Dict[str, Any],
    job_data: Dict[str, Any],
    preferences: Optional[Dict[str, Any]] = None,
) -> Tuple[np.ndarray, Dict[str, float]]:
    """
    Extracts the 15-dimensional standardized feature vector from candidate and job dictionary representations.
    Returns:
        (feature_vector: np.ndarray, feature_dict: Dict[str, float])
    """
    prefs = preferences or {}
    embedder = get_embedder()

    # -------------------------------------------------------------
    # 1. Candidate Information Normalization
    # -------------------------------------------------------------
    raw_cand_skills = candidate_data.get("skills", [])
    cand_skill_map = {}
    if isinstance(raw_cand_skills, list):
        for s in raw_cand_skills:
            if isinstance(s, dict):
                name = normalize_skill_name(s.get("name", ""))
                prof = s.get("proficiency", "INTERMEDIATE").upper()
            else:
                name = normalize_skill_name(str(s))
                prof = "INTERMEDIATE"
            if name:
                cand_skill_map[name.lower()] = {
                    "name": name,
                    "proficiency": prof,
                    "weight": PROFICIENCY_WEIGHTS.get(prof, 0.7),
                }

    cand_skills_list = [v["name"] for v in cand_skill_map.values()]
    cand_skills_set = set(cand_skill_map.keys())

    target_role = (prefs.get("target_role") or candidate_data.get("target_role") or "").strip()
    cand_major = (candidate_data.get("major") or "").strip()
    cand_uni = (candidate_data.get("university") or "").strip()
    cand_bio = clean_text(candidate_data.get("bio") or "")
    cand_raw_text = clean_text(candidate_data.get("raw_document_text") or "")
    cand_grad_year = candidate_data.get("graduation_year")

    # -------------------------------------------------------------
    # 2. Job Information Normalization
    # -------------------------------------------------------------
    job_title = (job_data.get("title") or "").strip()
    job_desc = clean_text(job_data.get("description") or "")
    job_location = (job_data.get("location") or "").lower().strip()
    job_emp_type = (job_data.get("employment_type") or "FULL_TIME").upper().strip()
    job_workplace = (job_data.get("workplace_type") or "ON_SITE").upper().strip()
    job_min_exp = int(job_data.get("min_experience_years") or 0)

    raw_job_skills = job_data.get("required_skills", []) or job_data.get("skills", [])
    job_req_skills = []
    job_pref_skills = []

    if isinstance(raw_job_skills, list):
        for js in raw_job_skills:
            if isinstance(js, dict):
                s_name = normalize_skill_name(js.get("name", ""))
                is_req = js.get("is_required", True)
            else:
                s_name = normalize_skill_name(str(js))
                is_req = True
            if s_name:
                if is_req:
                    job_req_skills.append(s_name)
                else:
                    job_pref_skills.append(s_name)

    job_req_set = {s.lower() for s in job_req_skills}
    job_pref_set = {s.lower() for s in job_pref_skills}

    # -------------------------------------------------------------
    # 3. Semantic Similarities (Sentence Transformers)
    # -------------------------------------------------------------
    # Feature 1: Skills Semantic Similarity
    cand_skills_str = ", ".join(cand_skills_list) if cand_skills_list else "General software skills"
    job_skills_str = ", ".join(job_req_skills) if job_req_skills else "General technical qualifications"
    vec_cand_skills = embedder.get_embedding(cand_skills_str)
    vec_job_skills = embedder.get_embedding(job_skills_str)
    sim_skills = embedder.compute_cosine_similarity(vec_cand_skills, vec_job_skills)

    # Feature 2: Experience / Narrative Semantic Similarity
    cand_exp_text = cand_raw_text or cand_bio or f"{cand_major} student with coursework in {cand_skills_str}"
    job_exp_text = job_desc or f"{job_title} vacancy requiring {job_skills_str}"
    vec_cand_exp = embedder.get_embedding(cand_exp_text[:1500])
    vec_job_exp = embedder.get_embedding(job_exp_text[:1500])
    sim_experience = embedder.compute_cosine_similarity(vec_cand_exp, vec_job_exp)

    # Feature 3: Target Role vs Job Title Semantic Similarity
    cand_role_anchor = f"{target_role or cand_major or 'Software Engineer'}"
    vec_cand_role = embedder.get_embedding(cand_role_anchor)
    vec_job_title = embedder.get_embedding(job_title or "Job Vacancy")
    sim_title_role = embedder.compute_cosine_similarity(vec_cand_role, vec_job_title)

    # Feature 4: Combined Unified Document Semantic Similarity
    combined_cand = f"Role: {cand_role_anchor}. Major: {cand_major}. Skills: {cand_skills_str}. Summary: {cand_bio[:300]}"
    combined_job = f"Title: {job_title}. Required: {job_skills_str}. Overview: {job_desc[:300]}"
    vec_comb_cand = embedder.get_embedding(combined_cand)
    vec_comb_job = embedder.get_embedding(combined_job)
    sim_combined_doc = embedder.compute_cosine_similarity(vec_comb_cand, vec_comb_job)

    # -------------------------------------------------------------
    # 4. Structured Skill Matching
    # -------------------------------------------------------------
    if job_req_set:
        matched_req = cand_skills_set.intersection(job_req_set)
        missing_req = job_req_set.difference(cand_skills_set)
        skill_jaccard_ratio = float(len(matched_req) / len(job_req_set))
        missing_required_ratio = float(len(missing_req) / len(job_req_set))
        missing_required_count = float(min(10, len(missing_req)) / 10.0)

        # Proficiency weighted score
        prof_score_sum = sum(cand_skill_map[s]["weight"] for s in matched_req)
        proficiency_weighted_score = float(prof_score_sum / len(job_req_set))
    else:
        # If job lists no skills explicitly, assume neutral baseline
        skill_jaccard_ratio = 0.70
        missing_required_ratio = 0.0
        missing_required_count = 0.0
        proficiency_weighted_score = 0.70

    if job_pref_set:
        matched_pref = cand_skills_set.intersection(job_pref_set)
        preferred_skills_ratio = float(len(matched_pref) / len(job_pref_set))
    else:
        preferred_skills_ratio = 1.0

    # -------------------------------------------------------------
    # 5. Metadata & Preference Matching
    # -------------------------------------------------------------
    # Feature 10: Location Compatibility
    pref_loc = (prefs.get("preferred_location") or "").lower().strip()
    if not pref_loc or pref_loc == "any":
        location_compatibility = 1.0
    elif job_location and (pref_loc in job_location or job_location in pref_loc):
        location_compatibility = 1.0
    elif "remote" in job_location:
        location_compatibility = 0.9
    else:
        location_compatibility = 0.1

    # Feature 11: Workplace Compatibility
    pref_workplace = (prefs.get("preferred_workplace_type") or "").upper().strip()
    if not pref_workplace:
        workplace_compatibility = 1.0
    elif pref_workplace == job_workplace:
        workplace_compatibility = 1.0
    elif pref_workplace == "HYBRID" and job_workplace in ("ON_SITE", "REMOTE"):
        workplace_compatibility = 0.6
    elif pref_workplace == "REMOTE" and job_workplace == "HYBRID":
        workplace_compatibility = 0.4
    else:
        workplace_compatibility = 0.0

    # Feature 12: Employment Type Match
    pref_emp = (prefs.get("preferred_employment_type") or "").upper().strip()
    if not pref_emp:
        employment_type_match = 1.0
    elif pref_emp == job_emp_type:
        employment_type_match = 1.0
    else:
        employment_type_match = 0.2

    # Feature 13: Experience Compatibility
    if job_min_exp == 0:
        experience_compatibility = 1.0
    else:
        # Estimate candidate experience from graduation year (current year ~ 2026)
        cand_exp_est = 0
        if cand_grad_year:
            try:
                grad_y = int(cand_grad_year)
                cand_exp_est = max(0, 2026 - grad_y)
            except (ValueError, TypeError):
                cand_exp_est = 0
        if cand_exp_est >= job_min_exp:
            experience_compatibility = 1.0
        else:
            experience_compatibility = max(0.2, float(cand_exp_est / job_min_exp))

    # Feature 14: Education Alignment
    has_uni = bool(cand_uni)
    has_major = bool(cand_major)
    if has_uni and has_major:
        education_alignment = 1.0
    elif has_uni or has_major:
        education_alignment = 0.7
    else:
        education_alignment = 0.4

    # Feature 15: Profile Completeness
    completeness_elements = [
        has_uni,
        has_major,
        bool(cand_bio),
        len(cand_skills_list) >= 3,
        bool(candidate_data.get("resume_file") or cand_raw_text),
    ]
    profile_completeness = float(sum(completeness_elements) / len(completeness_elements))

    # -------------------------------------------------------------
    # Build Final Standardized Vector
    # -------------------------------------------------------------
    feature_dict = {
        "sim_skills": float(sim_skills),
        "sim_experience": float(sim_experience),
        "sim_title_role": float(sim_title_role),
        "sim_combined_doc": float(sim_combined_doc),
        "skill_jaccard_ratio": float(skill_jaccard_ratio),
        "proficiency_weighted_score": float(proficiency_weighted_score),
        "missing_required_ratio": float(missing_required_ratio),
        "missing_required_count": float(missing_required_count),
        "preferred_skills_ratio": float(preferred_skills_ratio),
        "location_compatibility": float(location_compatibility),
        "workplace_compatibility": float(workplace_compatibility),
        "employment_type_match": float(employment_type_match),
        "experience_compatibility": float(experience_compatibility),
        "education_alignment": float(education_alignment),
        "profile_completeness": float(profile_completeness),
    }

    feature_vector = np.array([feature_dict[name] for name in FEATURE_NAMES], dtype=np.float32)
    return feature_vector, feature_dict


def extract_features_for_models(
    candidate,
    job,
    preferences: Optional[Dict[str, Any]] = None,
) -> Tuple[np.ndarray, Dict[str, float]]:
    """
    Convenience wrapper that converts Django ORM models (CandidateProfile and Job)
    into standard dictionaries and extracts the 15-dimensional feature vector.
    """
    # Build candidate dictionary
    cand_skills = []
    if candidate:
        for cs in candidate.skills.select_related("skill").all():
            if cs.skill:
                cand_skills.append({
                    "name": cs.skill.name,
                    "proficiency": cs.proficiency,
                })

    active_resume = getattr(candidate, "uploaded_resumes", None)
    latest_res = active_resume.filter(is_active=True).first() if active_resume else None
    raw_doc = latest_res.parsed_data.get("raw_document_text", "") if latest_res and isinstance(latest_res.parsed_data, dict) else ""

    candidate_dict = {
        "university": candidate.university if candidate else "",
        "major": candidate.major if candidate else "",
        "graduation_year": candidate.graduation_year if candidate else None,
        "bio": candidate.bio if candidate else "",
        "target_role": latest_res.target_role if latest_res else "",
        "skills": cand_skills,
        "resume_file": bool(candidate.resume_file) if candidate else False,
        "raw_document_text": raw_doc,
    }

    # Build job dictionary
    job_skills = []
    for js in job.job_skills.select_related("skill").all():
        if js.skill:
            job_skills.append({
                "name": js.skill.name,
                "is_required": getattr(js, "is_required", True),
            })

    job_dict = {
        "title": job.title,
        "description": job.description,
        "location": job.location,
        "employment_type": job.employment_type,
        "workplace_type": job.workplace_type,
        "min_experience_years": getattr(job, "min_experience_years", 0),
        "required_skills": job_skills,
    }

    return extract_features_from_dict(candidate_dict, job_dict, preferences)
