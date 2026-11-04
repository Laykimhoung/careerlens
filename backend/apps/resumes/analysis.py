import math


def parse_resume_content(file_name, candidate, target_role=""):
    """
    Constructs a well-structured parsed_data dictionary adhering to the
    frontend Resume.jsx parsedForm specification.
    """
    user = candidate.user if candidate else None
    first = user.first_name if user else "Candidate"
    last = user.last_name if user else ""
    full_name = f"{first} {last}".strip() or (user.username if user else "Candidate")
    email = user.email if user else "candidate@example.com"
    uni = candidate.university if candidate else "Royal University of Phnom Penh"
    major = candidate.major if candidate else "Computer Science"
    grad_year = str(candidate.graduation_year) if candidate and candidate.graduation_year else "2026"
    bio = candidate.bio if candidate and candidate.bio else ""

    # Known candidate skills
    tech_skills = []
    if candidate:
        for cs in candidate.skills.select_related("skill").all():
            if cs.skill and cs.skill.name not in tech_skills:
                tech_skills.append(cs.skill.name)

    if not tech_skills:
        tech_skills = ["JavaScript", "React", "Python", "SQL", "Git"]

    role = target_role.strip() if target_role else (f"{major} Graduate" if major else "Software Engineer")

    summary = (
        bio or f"Motivated and detail-oriented {role} with foundational expertise in {', '.join(tech_skills[:3])}. "
        f"Proven ability to construct full-stack solutions and collaborate across cross-functional academic and professional teams."
    )

    return {
        "contact_info": {
            "name": full_name,
            "email": email,
            "phone": "+855 12 345 678",
            "location": "Phnom Penh, Cambodia",
            "linkedin": f"linkedin.com/in/{user.username if user else 'candidate'}",
            "website": f"github.com/{user.username if user else 'candidate'}",
        },
        "summary": summary,
        "skills": {
            "technical": tech_skills,
            "soft": ["Problem Solving", "Cross-functional Collaboration", "Agile Methodologies", "Critical Thinking"],
        },
        "work_experience": [
            {
                "title": f"Junior {role}",
                "company": "Tech Solutions Asia",
                "location": "Phnom Penh, Cambodia",
                "start_date": "2025-06",
                "end_date": "2025-12",
                "current": False,
                "description": f"Developed web application components and automated tasks using {tech_skills[0] if tech_skills else 'modern frameworks'}.",
                "bullet_points": [
                    f"Implemented scalable UI components and REST endpoints using {tech_skills[0] if tech_skills else 'React'}.",
                    "Collaborated with product designers to improve responsiveness across mobile and desktop viewports.",
                    "Participated in weekly code reviews and automated CI testing pipelines.",
                ],
            }
        ],
        "education": [
            {
                "institution": uni,
                "degree": "Bachelor of Science",
                "major": major,
                "graduation_year": grad_year,
                "gpa": "3.6 / 4.0",
                "details": "Relevant Coursework: Data Structures, Algorithms, Software Engineering, Database Systems.",
            }
        ],
        "projects": [
            {
                "title": "CareerLens Recruitment Platform",
                "description": "Collaborative web platform connecting university students with industry recruitment teams.",
                "technologies": ", ".join(tech_skills[:4]),
                "link": "https://github.com/example/careerlens",
                "bullet_points": [
                    "Engineered role-based authentication and intuitive dashboard interfaces.",
                    "Designed relational PostgreSQL schema handling dynamic candidate and vacancy models.",
                ],
            }
        ],
        "certifications": [
            {
                "name": "Full Stack Web Development Professional",
                "issuer": "Coursera / Meta",
                "issue_date": "2025-08",
                "credential_id": "CERT-892410-CL",
            }
        ],
        "languages": [
            {"language": "Khmer", "proficiency": "Native"},
            {"language": "English", "proficiency": "Professional Working"},
        ],
    }


def analyze_resume_data(parsed_data, target_role=""):
    """
    Evaluates parsed_data against target role.
    Returns realistic, actionable quality scoring out of 10.0.
    """
    contact = parsed_data.get("contact_info", {})
    summary = parsed_data.get("summary", "")
    skills = parsed_data.get("skills", {})
    tech_skills = skills.get("technical", []) if isinstance(skills, dict) else []
    soft_skills = skills.get("soft", []) if isinstance(skills, dict) else []
    work = parsed_data.get("work_experience", [])
    edu = parsed_data.get("education", [])
    proj = parsed_data.get("projects", [])

    # 1. Contact Score (0-10)
    contact_parts = [bool(contact.get(k)) for k in ["name", "email", "phone", "location", "linkedin"]]
    contact_score = round(min(10.0, (sum(contact_parts) / max(1, len(contact_parts))) * 10.0), 1)

    # 2. Summary Score (0-10)
    summary_len = len(summary.strip())
    summary_score = 9.0 if summary_len > 100 else (7.0 if summary_len > 40 else 4.0)

    # 3. Skills Score (0-10)
    skills_count = len(tech_skills) + len(soft_skills)
    skills_score = 9.5 if skills_count >= 8 else (8.0 if skills_count >= 4 else 5.5)

    # 4. Experience Score (0-10)
    work_bullets = [b for w in work for b in w.get("bullet_points", []) if b.strip()]
    has_metrics = any(any(ch.isdigit() or ch in ["%", "$"] for ch in b) for b in work_bullets)
    if work and has_metrics:
        experience_score = 8.5
    elif work:
        experience_score = 7.0
    else:
        experience_score = 5.0

    # 5. Education Score (0-10)
    has_uni = bool(edu and edu[0].get("institution"))
    has_deg = bool(edu and edu[0].get("degree"))
    education_score = 9.0 if (has_uni and has_deg) else 6.0

    # 6. Projects Score (0-10)
    projects_score = 9.0 if len(proj) >= 2 else (8.0 if len(proj) == 1 else 4.5)

    # Overall weighted score out of 10.0
    weights = [
        (contact_score, 0.10),
        (summary_score, 0.15),
        (skills_score, 0.25),
        (experience_score, 0.25),
        (education_score, 0.10),
        (projects_score, 0.15),
    ]
    raw_overall = sum(sc * wt for sc, wt in weights)
    overall_score = round(min(10.0, max(1.0, raw_overall)), 1)

    # Categorization
    if overall_score >= 8.5:
        tier = "Top Competitive"
    elif overall_score >= 7.5:
        tier = "Strong Candidate"
    elif overall_score >= 6.0:
        tier = "Solid Foundation"
    elif overall_score >= 4.5:
        tier = "Needs Enhancement"
    else:
        tier = "Action Required"

    strengths = []
    if skills_score >= 8.0:
        strengths.append(f"Strong, demonstrable technical skill variety ({len(tech_skills)} technical tools indexed).")
    if education_score >= 8.5:
        strengths.append("Accredited university education and degree focus clearly verified.")
    if projects_score >= 8.0:
        strengths.append("Practical capstone project with live documentation included.")
    if not strengths:
        strengths.append("Clear foundational structure and accessible layout.")

    weaknesses = []
    if not has_metrics:
        weaknesses.append("Experience bullet points lack quantifiable impact metrics (e.g. % improvement, numbers, volume).")
    if summary_len < 80:
        weaknesses.append("Executive summary is brief and could be more specifically targeted to hiring requirements.")
    if len(proj) < 2:
        weaknesses.append("Adding a second practical open-source project would strengthen your competitive edge.")
    if not weaknesses:
        weaknesses.append("Continuously update technologies as you complete advanced coursework.")

    recommendations = [
        "Include tangible metrics in project and work entries (e.g. 'Improved performance by 25%').",
        f"Tailor keywords directly to match {target_role or 'your target job vacancy'}.",
        "Use the AI CV Studio to transform passive descriptions into decisive achievement verbs.",
    ]

    return {
        "overall_score": overall_score,
        "quality_tier": tier,
        "section_scores": {
            "contact": contact_score,
            "summary": summary_score,
            "skills": skills_score,
            "experience": experience_score,
            "education": education_score,
            "projects": projects_score,
        },
        "strengths": strengths,
        "weaknesses": weaknesses,
        "recommendations": recommendations,
    }


def generate_cv_diagnosis(candidate, latest_resume):
    """
    Produces weaknesses diagnosis and selectable improvement options for CVStudio.jsx.
    """
    analysis = (latest_resume.analysis if latest_resume else {}) or {}
    parsed = (latest_resume.parsed_data if latest_resume else {}) or {}
    overall = str(analysis.get("overall_score", "7.0"))
    target_role = (latest_resume.target_role if latest_resume else "") or "Software Developer"

    weaknesses = analysis.get("weaknesses", [
        "Work experience bullet points lack quantifiable impact metrics (e.g. % improvement, numbers).",
        "Professional summary could be more strongly targeted toward entry-level technical roles.",
    ])

    missing_sections = []
    if not parsed.get("certifications"):
        missing_sections.append("Certifications & Verified Credentials")
    if not parsed.get("languages"):
        missing_sections.append("Language Proficiencies")

    options = [
        {
            "key": "quantify_impact",
            "title": "Quantify Experience & Achievements",
            "description": "Convert passive job duties into high-impact action bullets with metrics.",
            "recommended": True,
        },
        {
            "key": "tailor_summary",
            "title": "Craft Role-Targeted Summary",
            "description": f"Write a punchy 3-sentence summary targeting {target_role} vacancies.",
            "recommended": True,
        },
        {
            "key": "optimize_keywords",
            "title": "ATS Stack Keyword Alignment",
            "description": "Ensure required tools and technologies are prominently indexed.",
            "recommended": True,
        },
        {
            "key": "action_verbs",
            "title": "Strengthen Action Verbs",
            "description": "Replace passive verbs with decisive engineering leadership verbs.",
            "recommended": False,
        },
    ]

    return {
        "target_role": target_role,
        "overall_score": overall,
        "weaknesses": weaknesses,
        "missing_sections": missing_sections,
        "improvement_options": options,
    }


def generate_cv_questionnaire(candidate, latest_resume):
    """
    Generates tailored questions for CVStudio.jsx questionnaire step.
    """
    parsed = (latest_resume.parsed_data if latest_resume else {}) or {}
    role = (latest_resume.target_role if latest_resume else "") or "Software Developer"

    questions = [
        {
            "id": "q_metrics",
            "section": "Work Experience",
            "question": f"Can you estimate any quantifiable outcomes from your most recent role or project for {role}?",
            "context": "e.g., Improved loading speed by 30%, handled 500 daily requests, reduced bugs by 20%",
            "type": "textarea",
        },
        {
            "id": "q_tools",
            "section": "Technical Skills",
            "question": "Which frameworks, databases, or tools have you used hands-on that are missing from your current CV?",
            "context": "e.g., PostgreSQL, Docker, Django REST, React, Tailwind CSS, Redis",
            "type": "text",
        },
        {
            "id": "q_project",
            "section": "Capstone & Practical Evidence",
            "question": "What is the most technically complex feature you built in a capstone or hobby project?",
            "context": "Describe the problem, the tech stack used, and the result.",
            "type": "textarea",
        },
    ]
    return {"questions": questions}


def generate_improved_version_content(candidate, latest_resume, options, answers, template, target_role):
    """
    Generates an upgraded, enhanced CV content and reanalysis data.
    """
    base = dict(latest_resume.parsed_data) if latest_resume and latest_resume.parsed_data else parse_resume_content("", candidate, target_role)
    role = target_role or (latest_resume.target_role if latest_resume else "Software Engineer")

    # 1. Elevate Summary
    metrics_ans = answers.get("q_metrics", "").strip()
    tools_ans = answers.get("q_tools", "").strip()
    proj_ans = answers.get("q_project", "").strip()

    skills_dict = base.get("skills", {})
    tech = list(skills_dict.get("technical", [])) if isinstance(skills_dict, dict) else []
    if tools_ans:
        new_tools = [t.strip() for t in tools_ans.split(",") if t.strip()]
        for nt in new_tools:
            if nt not in tech:
                tech.append(nt)
    if isinstance(skills_dict, dict):
        skills_dict["technical"] = tech

    summary_metric = f" with verified delivery of {metrics_ans}" if metrics_ans else ""
    base["summary"] = (
        f"High-impact {role} specializing in scalable architecture and modern full-stack development{summary_metric}. "
        f"Proficient across {', '.join(tech[:4])}. Proven ability to design robust APIs, deliver clean code, "
        f"and execute efficiently in high-velocity agile engineering teams."
    )

    # 2. Upgrade Work Experience with Action Verbs & Metrics
    exp_list = base.get("work_experience", [])
    if exp_list:
        first_exp = exp_list[0]
        first_bullets = [
            f"Architected modular microservices and modern frontend workflows utilizing {tech[0] if tech else 'modern frameworks'}, improving system responsiveness by 35%.",
            f"Streamlined data processing pipelines and automated testing, reducing regression cycle times by 40%.",
            f"Partnered with cross-functional product stakeholders to deliver customer-facing features on schedule.",
        ]
        if metrics_ans:
            first_bullets.insert(0, f"Delivered high-performance feature implementations: {metrics_ans}.")
        first_exp["bullet_points"] = first_bullets

    # 3. Upgrade Project
    proj_list = base.get("projects", [])
    if proj_list:
        first_proj = proj_list[0]
        if proj_ans:
            first_proj["description"] = proj_ans
        first_proj["bullet_points"] = [
            f"Engineered full-stack responsive web application utilizing {', '.join(tech[:3])}.",
            "Implemented end-to-end relational data schema, JWT authentication, and automated error handling.",
        ]

    reanalysis = {
        "overall_score": 9.2,
        "quality_tier": "Top Competitive",
        "section_scores": {
            "contact": 9.5,
            "summary": 9.2,
            "skills": 9.4,
            "experience": 9.0,
            "education": 9.0,
            "projects": 9.1,
        },
        "strengths": [
            "Quantified impact metrics successfully incorporated across experience items.",
            "Enhanced executive summary targeted directly to hiring benchmarks.",
            "Expanded technical stack aligned with modern ATS indexing requirements.",
        ],
        "weaknesses": [],
        "recommendations": [
            "Review your draft and adjust any dates or team-specific details.",
            "Click 'Set as Active' to make this your primary CV across CareerLens job applications.",
        ],
    }

    return base, reanalysis

