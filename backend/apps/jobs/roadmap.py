import math


ROLE_TAXONOMY = {
    "frontend": {
        "skills": ["JavaScript", "React", "TypeScript", "HTML5", "CSS3", "Tailwind CSS", "Redux", "Git"],
        "category": "Frontend Development",
    },
    "backend": {
        "skills": ["Python", "Django", "PostgreSQL", "REST APIs", "Docker", "Git", "Redis", "Unit Testing"],
        "category": "Backend Engineering",
    },
    "full stack": {
        "skills": ["React", "Node.js", "Python", "PostgreSQL", "TypeScript", "REST APIs", "Docker", "Git"],
        "category": "Full Stack Development",
    },
    "mobile": {
        "skills": ["React Native", "Flutter", "TypeScript", "Mobile UI", "REST APIs", "Git", "State Management"],
        "category": "Mobile Application Development",
    },
    "data": {
        "skills": ["Python", "SQL", "Pandas", "PostgreSQL", "Data Visualization", "Git", "Statistics", "Machine Learning"],
        "category": "Data Science & Analytics",
    },
    "ui/ux": {
        "skills": ["Figma", "Wireframing", "User Research", "Prototyping", "Design Systems", "Usability Testing", "HTML/CSS"],
        "category": "Product & UI/UX Design",
    },
    "qa": {
        "skills": ["Manual Testing", "Test Automation", "Selenium", "Postman", "API Testing", "Git", "Bug Tracking"],
        "category": "Quality Assurance & Testing",
    },
    "devops": {
        "skills": ["Docker", "Kubernetes", "CI/CD", "Linux", "AWS", "Git", "Terraform", "Monitoring"],
        "category": "DevOps & Cloud Engineering",
    },
}

POPULAR_ROLES = [
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Engineer",
    "Mobile Developer",
    "Data Analyst",
    "UI/UX Designer",
    "QA Engineer",
    "DevOps Engineer",
]


def match_role_taxonomy(role_name):
    low = (role_name or "").lower()
    for key, data in ROLE_TAXONOMY.items():
        if key in low:
            return data
    # Fallback to general software engineering
    return {
        "skills": ["Programming", "Data Structures", "Git", "REST APIs", "Databases", "Problem Solving"],
        "category": "Software Engineering",
    }


def generate_stages(target_role, weekly_hours, missing_skills, demonstrated_skills):
    """
    Generates 5 progressive, staged learning stages tailored to weekly study commitment.
    """
    hours = max(4, weekly_hours or 10)
    # Estimate weeks per stage inversely proportional to weekly hours (base ~20 hours per stage)
    base_weeks = max(1, round(20 / hours))

    top_missing = [s["name"] for s in missing_skills][:4]
    first_missing = top_missing[0] if len(top_missing) > 0 else "Advanced Core Fundamentals"
    second_missing = top_missing[1] if len(top_missing) > 1 else "Framework Architecture"
    third_missing = top_missing[2] if len(top_missing) > 2 else "System Design & Storage"
    fourth_missing = top_missing[3] if len(top_missing) > 3 else "Cloud & Deployment"

    stages = [
        {
            "id": 1,
            "stage_number": 1,
            "title": f"Stage 1: Core Fundamentals & {first_missing} Mastery",
            "description": f"Build or solidify rock-solid foundational concepts required for {target_role}.",
            "estimated_weeks": base_weeks,
            "milestones": [
                {
                    "id": 101,
                    "title": f"Master Foundations of {first_missing}",
                    "description": f"Study syntax, foundational conventions, and modern design patterns for {first_missing}.",
                    "status": "not_started",
                    "deliverables": "Repository of standard patterns and algorithmic exercises.",
                    "resources": [
                        {"name": "Official Documentation", "url": "https://developer.mozilla.org", "description": "Core syntax and standards."},
                        {"name": "Roadmap.sh Guides", "url": "https://roadmap.sh", "description": "Interactive developer path."},
                    ],
                    "notes": "",
                },
                {
                    "id": 102,
                    "title": "Development Environment & Version Control",
                    "description": "Establish a production-grade local environment, clean Git workflows, and linters.",
                    "status": "not_started",
                    "deliverables": "Configured repository template with pre-commit hooks and semantic commit messages.",
                    "resources": [
                        {"name": "Pro Git Book", "url": "https://git-scm.com/book/en/v2", "description": "Industry git branching models."},
                    ],
                    "notes": "",
                },
            ],
        },
        {
            "id": 2,
            "stage_number": 2,
            "title": f"Stage 2: Applied Architecture & {second_missing}",
            "description": f"Implement structured components and data flow using {second_missing}.",
            "estimated_weeks": base_weeks + 1,
            "milestones": [
                {
                    "id": 201,
                    "title": f"Deep Dive into {second_missing} and Modern State/Flow",
                    "description": f"Understand lifecycle, state encapsulation, and asynchronous operations in {second_missing}.",
                    "status": "not_started",
                    "deliverables": "Functional prototype implementing full CRUD operations with external services.",
                    "resources": [
                        {"name": "FreeCodeCamp In-depth Guides", "url": "https://www.freecodecamp.org/news/", "description": "Practical architectural guides."},
                    ],
                    "notes": "",
                },
                {
                    "id": 202,
                    "title": "API Design & Clean Code Practices",
                    "description": "Construct maintainable, modular modules adhering to DRY and SOLID architectural principles.",
                    "status": "not_started",
                    "deliverables": "Refactored codebase featuring typed interfaces and organized folder layout.",
                    "resources": [
                        {"name": "Clean Code Summary", "url": "https://github.com/ryanmcdermott/clean-code-javascript", "description": "Clean architecture patterns."},
                    ],
                    "notes": "",
                },
            ],
        },
        {
            "id": 3,
            "stage_number": 3,
            "title": f"Stage 3: Capstone Project with {third_missing}",
            "description": f"Synthesize knowledge into a real-world project demonstrating practical competence.",
            "estimated_weeks": base_weeks + 1,
            "milestones": [
                {
                    "id": 301,
                    "title": "Real-world Capstone Architecture",
                    "description": f"Design and architect an end-to-end application integrating {target_role} responsibilities and {third_missing}.",
                    "status": "not_started",
                    "deliverables": "Live working application with comprehensive documentation and README.",
                    "resources": [
                        {"name": "Full Stack Open", "url": "https://fullstackopen.com/en/", "description": "Hands-on project development."},
                    ],
                    "notes": "",
                },
                {
                    "id": 302,
                    "title": "Robust Data Modeling & Error Resilience",
                    "description": "Implement data validation, edge-case resilience, and descriptive logging.",
                    "status": "not_started",
                    "deliverables": "Automated validation layer handling edge cases and network disconnects gracefully.",
                    "resources": [
                        {"name": "Backend Best Practices", "url": "https://github.com/goldbergyoni/nodebestpractices", "description": "Production standards."},
                    ],
                    "notes": "",
                },
            ],
        },
        {
            "id": 4,
            "stage_number": 4,
            "title": f"Stage 4: Automated Testing & {fourth_missing}",
            "description": "Verify code quality, unit testing, automated CI pipelines, and performance.",
            "estimated_weeks": base_weeks,
            "milestones": [
                {
                    "id": 401,
                    "title": "Comprehensive Unit & Integration Testing",
                    "description": "Write automated test suites covering core business logic and critical paths.",
                    "status": "not_started",
                    "deliverables": "Test suite achieving 70%+ coverage with zero regression failures.",
                    "resources": [
                        {"name": "Testing Guidelines", "url": "https://martinfowler.com/articles/practical-test-pyramid.html", "description": "Practical test pyramid."},
                    ],
                    "notes": "",
                },
                {
                    "id": 402,
                    "title": "CI/CD Pipeline & Build Optimization",
                    "description": "Configure GitHub Actions or equivalent workflow to automate test runs and lint checks on each pull request.",
                    "status": "not_started",
                    "deliverables": "Working CI pipeline badge embedded in your project repository.",
                    "resources": [
                        {"name": "GitHub Actions Documentation", "url": "https://docs.github.com/en/actions", "description": "Automating builds."},
                    ],
                    "notes": "",
                },
            ],
        },
        {
            "id": 5,
            "stage_number": 5,
            "title": "Stage 5: Portfolio Polish, Deployment & Interview Prep",
            "description": f"Showcase your verified capabilities to hiring teams hiring for {target_role}.",
            "estimated_weeks": max(1, base_weeks - 1),
            "milestones": [
                {
                    "id": 501,
                    "title": "Production Deployment & Live Demo URL",
                    "description": "Deploy capstone to cloud hosting (e.g. Vercel, Render) with HTTPS and live database connection.",
                    "status": "not_started",
                    "deliverables": "Public live URL with demo credentials and interactive preview.",
                    "resources": [
                        {"name": "Deployment Guides", "url": "https://render.com/docs", "description": "Deploying web services."},
                    ],
                    "notes": "",
                },
                {
                    "id": 502,
                    "title": "Technical Interview Preparation & CV Sync",
                    "description": "Practice system design, explainable problem-solving walkthroughs, and sync newly acquired skills to your CV.",
                    "status": "not_started",
                    "deliverables": "Updated CV profile in CareerLens featuring capstone link and verified competencies.",
                    "resources": [
                        {"name": "Tech Interview Handbook", "url": "https://www.techinterviewhandbook.org/", "description": "Curated interview strategies."},
                    ],
                    "notes": "",
                },
            ],
        },
    ]
    return stages


def build_roadmap_dict(candidate, target_role, target_job=None, weekly_hours=10):
    """
    Constructs a complete roadmap data structure ready for candidate display and storage.
    """
    weekly_hours = max(4, min(40, weekly_hours or 10))
    role_title = target_role or (target_job.title if target_job else "Software Engineer")
    taxonomy = match_role_taxonomy(role_title)

    # 1. Determine job required skills if job is provided
    job_skills_list = []
    if target_job:
        job_skills_list = [js.skill.name for js in target_job.job_skills.all() if js.skill]

    if not job_skills_list:
        job_skills_list = taxonomy["skills"]

    # 2. Extract candidate known skills
    candidate_skills = {}
    if candidate:
        for cs in candidate.skills.select_related("skill").all():
            if cs.skill:
                candidate_skills[cs.skill.name.lower()] = {
                    "name": cs.skill.name,
                    "proficiency": cs.proficiency,
                }

    # 3. Categorize into Demonstrated vs Missing
    demonstrated_skills = []
    missing_skills = []

    for idx, skill_name in enumerate(job_skills_list):
        s_low = skill_name.lower()
        priority = "High" if idx < 3 else ("Medium" if idx < 6 else "Low")
        category = taxonomy.get("category", "Technical Competency")

        if s_low in candidate_skills:
            cand_s = candidate_skills[s_low]
            demonstrated_skills.append({
                "name": cand_s["name"],
                "source": f"CV Verified ({cand_s['proficiency']})",
                "category": category,
            })
        else:
            missing_skills.append({
                "name": skill_name,
                "priority": priority,
                "category": category,
                "status": "gap",  # "gap" | "confirmed_know" | "learning" | "completed"
            })

    # 4. Generate the 5-stage personalized learning roadmap
    stages = generate_stages(role_title, weekly_hours, missing_skills, demonstrated_skills)

    # 5. Compute milestone counts and readiness
    all_milestones = [m for st in stages for m in st.get("milestones", [])]
    total_milestones = len(all_milestones)
    completed_milestones = sum(1 for m in all_milestones if m.get("status") == "completed")

    # Initial readiness calculation
    total_skills = len(demonstrated_skills) + len(missing_skills)
    skill_ratio = (len(demonstrated_skills) / total_skills) if total_skills > 0 else 0.5
    readiness_score = min(100, round(skill_ratio * 70) + round((completed_milestones / max(1, total_milestones)) * 30))

    target_job_data = None
    if target_job:
        target_job_data = {
            "id": target_job.id,
            "title": target_job.title,
            "location": target_job.location,
            "employment_type": target_job.employment_type,
            "company": {
                "id": target_job.company.id if target_job.company else None,
                "company_name": target_job.company.company_name if target_job.company else "Company",
            },
        }

    recommendations = [
        f"Prioritize mastering {missing_skills[0]['name'] if missing_skills else 'core stack'} in Stage 1 to quickly bridge your highest-priority gap.",
        f"Dedicate {weekly_hours} hours per week to complete all 5 progressive milestone deliverables.",
        "Update your CareerLens CV Studio profile as you complete milestones to demonstrate real-time readiness to employers.",
    ]

    return {
        "target_role": role_title,
        "target_job": target_job_data,
        "readiness_score": readiness_score,
        "weekly_hours": weekly_hours,
        "total_milestones": total_milestones,
        "completed_milestones": completed_milestones,
        "missing_skills": missing_skills,
        "demonstrated_skills": demonstrated_skills,
        "additional_recommendations": recommendations,
        "stages": stages,
    }


def recalculate_roadmap_metrics(roadmap_dict, candidate):
    """
    Recalculates milestone progress, skills alignment, and readiness score.
    """
    if not roadmap_dict:
        return roadmap_dict

    # Check candidate profile skills against missing skills
    candidate_skills = {}
    if candidate:
        for cs in candidate.skills.select_related("skill").all():
            if cs.skill:
                candidate_skills[cs.skill.name.lower()] = cs.skill.name

    missing = roadmap_dict.get("missing_skills", [])
    demonstrated = roadmap_dict.get("demonstrated_skills", [])
    demo_names_lower = {s["name"].lower() for s in demonstrated}

    still_missing = []
    for s in missing:
        name_low = s["name"].lower()
        if name_low in candidate_skills and name_low not in demo_names_lower:
            demonstrated.append({
                "name": candidate_skills[name_low],
                "source": "Profile Verified",
                "category": s.get("category", "Technical Competency"),
            })
            demo_names_lower.add(name_low)
        else:
            still_missing.append(s)

    roadmap_dict["missing_skills"] = still_missing
    roadmap_dict["demonstrated_skills"] = demonstrated

    # Tally milestones
    stages = roadmap_dict.get("stages", [])
    all_milestones = [m for st in stages for m in st.get("milestones", [])]
    total_m = len(all_milestones)
    completed_m = sum(1 for m in all_milestones if m.get("status") == "completed")

    roadmap_dict["total_milestones"] = total_m
    roadmap_dict["completed_milestones"] = completed_m

    # Score calculation
    total_skills = len(demonstrated) + len(still_missing)
    # Extra credit for skills candidate marked as "confirmed_know" or "completed" in roadmap
    skill_credits = len(demonstrated)
    for s in still_missing:
        st = s.get("status", "gap")
        if st in ["confirmed_know", "completed"]:
            skill_credits += 1
        elif st == "learning":
            skill_credits += 0.5

    skill_ratio = (skill_credits / total_skills) if total_skills > 0 else 0.5
    milestone_ratio = (completed_m / max(1, total_m))
    readiness = min(100, round(skill_ratio * 65) + round(milestone_ratio * 35))
    roadmap_dict["readiness_score"] = readiness

    return roadmap_dict

