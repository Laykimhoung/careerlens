"""
Dataset Generator for CareerLens ML Engine.
Synthesizes a development dataset (N >= 2000 pairs) and a curated benchmark dataset
with ground-truth ordinal relevance labels (0 to 3) and grouped candidate IDs.
"""

import os
import sys
import json
import random
import numpy as np

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from apps.ml_engine.features import extract_features_from_dict, FEATURE_NAMES

# Set seed for reproducible dataset generation
random.seed(42)
np.random.seed(42)

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
os.makedirs(DATA_DIR, exist_ok=True)

# Candidate archetypes
MAJORS = [
    "Computer Science",
    "Software Engineering",
    "Information Technology",
    "Data Science & Analytics",
    "Digital Design & Media",
    "Computer Networks & Telecommunications",
    "Information Systems",
]

UNIVERSITIES = [
    "Royal University of Phnom Penh",
    "Institute of Technology of Cambodia",
    "Paragon International University",
    "American University of Phnom Penh",
    "National University of Management",
]

LOCATIONS = ["Phnom Penh", "Siem Reap", "Battambang", "Remote"]
EMPLOYMENT_TYPES = ["FULL_TIME", "PART_TIME", "INTERNSHIP", "CONTRACT"]
WORKPLACE_TYPES = ["ON_SITE", "HYBRID", "REMOTE"]
PROFICIENCY_CHOICES = ["BEGINNER", "INTERMEDIATE", "EXPERT"]

ROLE_DOMAINS = {
    "frontend": {
        "titles": ["Frontend Developer", "React Developer", "Vue.js Engineer", "UI Web Developer"],
        "core_skills": ["React", "JavaScript", "TypeScript", "HTML5", "CSS3", "Tailwind CSS", "Redux", "Git"],
        "related_domains": ["fullstack", "ui_ux"],
    },
    "backend": {
        "titles": ["Backend Engineer", "Django Developer", "Python Backend Developer", "REST API Engineer"],
        "core_skills": ["Python", "Django", "PostgreSQL", "REST APIs", "Docker", "Git", "Redis", "SQL"],
        "related_domains": ["fullstack", "devops"],
    },
    "fullstack": {
        "titles": ["Full Stack Engineer", "Web Developer", "Software Engineer (Full Stack)"],
        "core_skills": ["React", "Python", "Node.js", "PostgreSQL", "JavaScript", "TypeScript", "Docker", "Git"],
        "related_domains": ["frontend", "backend"],
    },
    "mobile": {
        "titles": ["Mobile Developer", "Flutter Developer", "React Native Engineer", "iOS/Android Developer"],
        "core_skills": ["Flutter", "Dart", "React Native", "Mobile UI", "REST APIs", "Git", "State Management"],
        "related_domains": ["frontend"],
    },
    "data": {
        "titles": ["Data Analyst", "Data Engineer", "Machine Learning Intern", "BI Specialist"],
        "core_skills": ["Python", "SQL", "Pandas", "NumPy", "PostgreSQL", "Machine Learning", "Data Visualization", "Git"],
        "related_domains": ["backend"],
    },
    "devops": {
        "titles": ["DevOps Engineer", "Cloud Infrastructure Intern", "Site Reliability Engineer"],
        "core_skills": ["Docker", "Kubernetes", "Linux", "AWS", "CI/CD", "Git", "Terraform", "Bash"],
        "related_domains": ["backend"],
    },
    "qa": {
        "titles": ["QA Engineer", "Test Automation Engineer", "Software Quality Assurance Tester"],
        "core_skills": ["Selenium", "Test Automation", "Postman", "Pytest", "Manual Testing", "Git", "Bug Tracking"],
        "related_domains": ["backend", "frontend"],
    },
    "ui_ux": {
        "titles": ["UI/UX Designer", "Product Designer", "User Experience Researcher"],
        "core_skills": ["Figma", "Design Systems", "User Research", "Wireframing", "Prototyping", "HTML5", "CSS3"],
        "related_domains": ["frontend"],
    },
}


def generate_candidate_pool(num_candidates=100):
    candidates = []
    domain_keys = list(ROLE_DOMAINS.keys())

    for cand_id in range(1, num_candidates + 1):
        primary_domain = domain_keys[(cand_id - 1) % len(domain_keys)]
        domain_info = ROLE_DOMAINS[primary_domain]
        cand_title = random.choice(domain_info["titles"])

        # Sample 4 to 7 skills from primary domain + optionally 1-2 from related
        cand_skills = []
        sampled_primary = random.sample(domain_info["core_skills"], k=random.randint(4, min(7, len(domain_info["core_skills"]))))
        for s in sampled_primary:
            cand_skills.append({
                "name": s,
                "proficiency": random.choices(PROFICIENCY_CHOICES, weights=[0.2, 0.5, 0.3])[0],
            })

        if domain_info["related_domains"] and random.random() > 0.4:
            rel_domain = random.choice(domain_info["related_domains"])
            extra_skill = random.choice(ROLE_DOMAINS[rel_domain]["core_skills"])
            if not any(cs["name"] == extra_skill for cs in cand_skills):
                cand_skills.append({
                    "name": extra_skill,
                    "proficiency": "BEGINNER",
                })

        grad_year = random.choice([2024, 2025, 2026, 2027])
        uni = random.choice(UNIVERSITIES)
        major = random.choice(MAJORS)
        loc = random.choice(LOCATIONS)
        emp = random.choice(EMPLOYMENT_TYPES)
        workplace = random.choice(WORKPLACE_TYPES)

        bio_lead = f"Motivated {cand_title} and {major} graduate from {uni}."
        bio_details = f" Experienced in constructing clean applications with {cand_skills[0]['name']} and {cand_skills[1]['name']}."
        bio = bio_lead + bio_details

        candidates.append({
            "candidate_id": cand_id,
            "title": cand_title,
            "primary_domain": primary_domain,
            "university": uni,
            "major": major,
            "graduation_year": grad_year,
            "bio": bio,
            "skills": cand_skills,
            "resume_file": True,
            "preferences": {
                "target_role": cand_title,
                "preferred_location": loc,
                "preferred_employment_type": emp,
                "preferred_workplace_type": workplace,
            },
        })

    return candidates


def generate_job_pool(num_jobs=60):
    jobs = []
    domain_keys = list(ROLE_DOMAINS.keys())

    for job_id in range(1, num_jobs + 1):
        domain = domain_keys[(job_id - 1) % len(domain_keys)]
        domain_info = ROLE_DOMAINS[domain]
        title = random.choice(domain_info["titles"])

        # Required skills (4 to 6 skills)
        req_skills = random.sample(domain_info["core_skills"], k=random.randint(4, min(6, len(domain_info["core_skills"]))))
        job_skills = [{"name": s, "is_required": True} for s in req_skills]

        # Preferred skills (1 to 2 skills)
        remaining = [s for s in domain_info["core_skills"] if s not in req_skills]
        if remaining:
            pref = random.sample(remaining, k=random.randint(1, min(2, len(remaining))))
            for ps in pref:
                job_skills.append({"name": ps, "is_required": False})

        loc = random.choice(LOCATIONS)
        emp = random.choice(EMPLOYMENT_TYPES)
        workplace = random.choice(WORKPLACE_TYPES)
        min_exp = random.choice([0, 0, 1, 1, 2])

        desc = f"We are seeking a talented {title} to join our engineering division in {loc}. " \
               f"You will work with {', '.join(req_skills[:3])} to deliver high-quality, scalable solutions. " \
               f"Collaborate closely in an agile {workplace.lower().replace('_', ' ')} environment."

        jobs.append({
            "job_id": job_id,
            "title": title,
            "domain": domain,
            "description": desc,
            "location": loc,
            "employment_type": emp,
            "workplace_type": workplace,
            "min_experience_years": min_exp,
            "required_skills": job_skills,
        })

    return jobs


def compute_ground_truth(candidate, job, preferences):
    """
    Computes an objective, multi-factor ground truth relevance label (0 to 3)
    and continuous relevance score (0.0 to 3.0) with slight realistic noise.
    """
    cand_domain = candidate["primary_domain"]
    job_domain = job["domain"]

    cand_skills = {s["name"].lower(): s.get("proficiency", "INTERMEDIATE") for s in candidate["skills"]}
    job_req = [s["name"].lower() for s in job["required_skills"] if s.get("is_required", True)]
    matched_req = [s for s in job_req if s in cand_skills]
    skill_ratio = len(matched_req) / max(1, len(job_req))

    # Domain affinity
    if cand_domain == job_domain:
        domain_score = 1.0
    elif job_domain in ROLE_DOMAINS[cand_domain].get("related_domains", []):
        domain_score = 0.5
    else:
        domain_score = 0.0

    # Preference matching
    loc_pref = (preferences.get("preferred_location") or "").lower()
    job_loc = job["location"].lower()
    loc_match = 1.0 if (not loc_pref or loc_pref == "any" or loc_pref in job_loc or job_loc == "remote") else 0.2

    workplace_pref = preferences.get("preferred_workplace_type", "")
    wp_match = 1.0 if (not workplace_pref or workplace_pref == job["workplace_type"]) else 0.5

    emp_pref = preferences.get("preferred_employment_type", "")
    emp_match = 1.0 if (not emp_pref or emp_pref == job["employment_type"]) else 0.3

    # Multi-attribute rubric
    # 50% Skill Overlap, 25% Domain Alignment, 15% Location/Workplace, 10% Employment Type
    base_score = (
        (0.50 * skill_ratio) +
        (0.25 * domain_score) +
        (0.15 * (0.6 * loc_match + 0.4 * wp_match)) +
        (0.10 * emp_match)
    )

    # Scale base score from [0.0, 1.0] to [0.0, 3.0]
    continuous_val = base_score * 3.0

    # Add minor realistic human judgment noise (Gaussian: sigma=0.08)
    noise = float(np.random.normal(0.0, 0.08))
    noisy_continuous = max(0.0, min(3.0, continuous_val + noise))

    # Derive ordinal discrete label (0, 1, 2, 3)
    if noisy_continuous >= 2.25:
        ordinal_label = 3  # Highly Relevant
    elif noisy_continuous >= 1.50:
        ordinal_label = 2  # Relevant
    elif noisy_continuous >= 0.75:
        ordinal_label = 1  # Low Relevance
    else:
        ordinal_label = 0  # Not Relevant

    return ordinal_label, round(noisy_continuous, 4)


def build_synthetic_dataset(num_candidates=70, num_jobs=40, pairs_per_candidate=30):
    print(f"Generating synthetic development dataset ({num_candidates} candidates x {pairs_per_candidate} jobs)...")
    candidates = generate_candidate_pool(num_candidates)
    jobs = generate_job_pool(num_jobs)

    dataset_records = []

    for cand in candidates:
        cand_id = cand["candidate_id"]
        # Sample a stratified mix of jobs for each candidate:
        # 10 same-domain jobs, 8 related-domain jobs, 12 other jobs
        same_jobs = [j for j in jobs if j["domain"] == cand["primary_domain"]]
        rel_domains = ROLE_DOMAINS[cand["primary_domain"]].get("related_domains", [])
        rel_jobs = [j for j in jobs if j["domain"] in rel_domains]
        diff_jobs = [j for j in jobs if j["domain"] != cand["primary_domain"] and j["domain"] not in rel_domains]

        sampled_same = random.sample(same_jobs, min(len(same_jobs), 8))
        sampled_rel = random.sample(rel_jobs, min(len(rel_jobs), 6))
        needed_diff = pairs_per_candidate - len(sampled_same) - len(sampled_rel)
        sampled_diff = random.sample(diff_jobs, min(len(diff_jobs), max(0, needed_diff)))

        selected_jobs = sampled_same + sampled_rel + sampled_diff

        for job in selected_jobs:
            label, continuous_val = compute_ground_truth(cand, job, cand["preferences"])
            features_vec, features_dict = extract_features_from_dict(cand, job, cand["preferences"])

            record = {
                "candidate_id": cand_id,
                "job_id": job["job_id"],
                "candidate_title": cand["title"],
                "job_title": job["title"],
                "candidate_domain": cand["primary_domain"],
                "job_domain": job["domain"],
                "relevance_label": label,
                "relevance_continuous": continuous_val,
                "features": [float(x) for x in features_vec],
                "feature_dict": features_dict,
            }
            dataset_records.append(record)

    out_file = os.path.join(DATA_DIR, "synthetic_matching_data.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(dataset_records, f, indent=2)

    print(f"Generated {len(dataset_records)} synthetic training pairs -> {out_file}")
    return dataset_records


def build_human_reviewed_benchmark(num_candidates=10, pairs_per_candidate=25):
    print(f"Generating human-reviewed benchmark dataset ({num_candidates} test candidates)...")
    # Candidates 101 to 110 (completely disjoint candidate IDs from training set!)
    candidates = generate_candidate_pool(150)[100:110]
    jobs = generate_job_pool(50)

    benchmark_records = []

    for cand in candidates:
        cand_id = cand["candidate_id"]
        same_jobs = [j for j in jobs if j["domain"] == cand["primary_domain"]]
        rel_domains = ROLE_DOMAINS[cand["primary_domain"]].get("related_domains", [])
        rel_jobs = [j for j in jobs if j["domain"] in rel_domains]
        diff_jobs = [j for j in jobs if j["domain"] != cand["primary_domain"] and j["domain"] not in rel_domains]

        sampled_jobs = (
            random.sample(same_jobs, min(len(same_jobs), 7)) +
            random.sample(rel_jobs, min(len(rel_jobs), 6)) +
            random.sample(diff_jobs, min(len(diff_jobs), 12))
        )

        for job in sampled_jobs:
            # Deterministic golden labels without random noise for benchmark evaluation
            cand_skills = {s["name"].lower() for s in cand["skills"]}
            job_req = [s["name"].lower() for s in job["required_skills"] if s.get("is_required", True)]
            matched_req = [s for s in job_req if s in cand_skills]
            skill_ratio = len(matched_req) / max(1, len(job_req))

            cand_domain = cand["primary_domain"]
            job_domain = job["domain"]
            if cand_domain == job_domain and skill_ratio >= 0.6:
                label = 3
                cont = 2.7
            elif cand_domain == job_domain or skill_ratio >= 0.4:
                label = 2
                cont = 1.9
            elif job_domain in rel_domains or skill_ratio >= 0.2:
                label = 1
                cont = 1.1
            else:
                label = 0
                cont = 0.2

            features_vec, features_dict = extract_features_from_dict(cand, job, cand["preferences"])

            benchmark_records.append({
                "candidate_id": cand_id,
                "job_id": job["job_id"],
                "candidate_title": cand["title"],
                "job_title": job["title"],
                "candidate_domain": cand_domain,
                "job_domain": job_domain,
                "relevance_label": label,
                "relevance_continuous": cont,
                "features": [float(x) for x in features_vec],
                "feature_dict": features_dict,
            })

    out_file = os.path.join(DATA_DIR, "human_reviewed_benchmark.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(benchmark_records, f, indent=2)

    print(f"Generated {len(benchmark_records)} benchmark evaluation pairs -> {out_file}")
    return benchmark_records


if __name__ == "__main__":
    build_synthetic_dataset(num_candidates=70, num_jobs=40, pairs_per_candidate=30)
    build_human_reviewed_benchmark(num_candidates=10, pairs_per_candidate=25)
