import json
import logging
from django.conf import settings
from .models import Application, InterviewPreparation
from apps.resumes.gemini_service import gemini_generate_interview_prep

logger = logging.getLogger(__name__)


def build_candidate_context(candidate):
    """
    Extracts candidate profile summary, verified skills, and academic background.
    """
    skills = [
        cs.skill.name for cs in candidate.skills.select_related('skill').all()
    ]
    u = candidate.user
    full_name = f"{u.first_name} {u.last_name}".strip() or u.username
    return {
        "candidate_id": candidate.id,
        "name": full_name,
        "university": candidate.university or "University Graduate",
        "major": candidate.major or "Computer Science / Information Technology",
        "graduation_year": candidate.graduation_year or 2026,
        "bio": candidate.bio or "",
        "verified_skills": skills,
    }


def build_job_context(job):
    """
    Extracts job role, company name, required skills, and core requirements.
    """
    job_skills = [
        js.skill.name for js in job.job_skills.select_related('skill').all()
    ]
    company_name = (
        job.company.company_name
        if hasattr(job, 'company') and job.company
        else "Hiring Company"
    )
    return {
        "job_id": job.id,
        "title": job.title,
        "company_name": company_name,
        "location": job.location or "Cambodia",
        "employment_type": job.get_employment_type_display(),
        "workplace_type": job.get_workplace_type_display(),
        "description": job.description[:2000] if job.description else "",
        "required_skills": job_skills,
    }


def synthesize_fallback_interview_prep(job_data, candidate_data):
    """
    Provides a comprehensive, role-tailored interview preparation guide
    when Gemini API key is not provided or Gemini service is unreachable.
    """
    job_title = job_data.get("title") or "Software Engineer"
    company_name = job_data.get("company_name") or "Employer"
    req_skills = job_data.get("required_skills") or ["Software Development", "Problem Solving"]
    cand_skills = candidate_data.get("verified_skills") or []
    cand_name = candidate_data.get("name") or "Candidate"

    primary_skill = req_skills[0] if req_skills else "Software Engineering"
    secondary_skill = req_skills[1] if len(req_skills) > 1 else (cand_skills[0] if cand_skills else "System Design")

    overlap_skills = [s for s in cand_skills if any(s.lower() == r.lower() for r in req_skills)]
    highlight_skill = overlap_skills[0] if overlap_skills else (cand_skills[0] if cand_skills else primary_skill)

    checklist = [
        {
            "step": f"Deep Dive into {company_name}'s Products & Culture",
            "timeline": "3-5 Days Before",
            "details": f"Review {company_name}'s website, mission statement, recent announcements, and product architecture. Understand how the {job_title} role directly supports their business objectives."
        },
        {
            "step": f"Hands-on Technical Practice ({primary_skill} & {secondary_skill})",
            "timeline": "2-3 Days Before",
            "details": f"Brush up on core principles of {primary_skill} and {secondary_skill}. Prepare 2-3 project examples from your portfolio where you designed or debugged key components."
        },
        {
            "step": "Master the STAR Behavioral Methodology",
            "timeline": "1-2 Days Before",
            "details": "Structure responses using Situation, Task, Action, and Result. Focus on challenges overcome, team collaboration, and quantifiable improvements."
        },
        {
            "step": "Environment & Portfolio Verification",
            "timeline": "Day of Interview",
            "details": f"Test camera, microphone, internet connection, and screen-sharing permissions. Have your GitHub, live demo links, and resume open in clean tabs."
        },
        {
            "step": "Final Mental Reset & Log In Early",
            "timeline": "15 Minutes Before",
            "details": "Join the meeting room 5 minutes early. Have a notebook and pen ready to take notes, plus your curated questions for the interviewer."
        }
    ]

    likely_questions = [
        {
            "id": 1,
            "category": "Role & Technical Fit",
            "question": f"Why are you excited to join {company_name} as a {job_title}, and how does your background fit our needs?",
            "why_asked": f"Evaluates whether you researched {company_name} and understand the expectations of the {job_title} role.",
            "model_answer": f"Connect your passion for {company_name}'s domain with your verified strengths in {highlight_skill}. Express how you can deliver value immediately and grow alongside their engineering team.",
            "key_points_to_include": [
                f"Knowledge of {company_name}'s mission and market position",
                f"Demonstrated competence in {highlight_skill}",
                "Eagerness to tackle complex technical challenges"
            ]
        },
        {
            "id": 2,
            "category": "Technical Architecture",
            "question": f"How do you approach designing and maintaining scalable applications using {primary_skill}?",
            "why_asked": "Assesses foundational engineering craftsmanship, code cleanliness, and architectural decision-making.",
            "model_answer": "Explain your step-by-step approach: modular separation of concerns, writing clean and testable code, handling edge cases, and measuring performance bottlenecks.",
            "key_points_to_include": [
                "Clean code architecture and DRY principles",
                "Error handling and boundary validation",
                "Performance optimization and caching strategies"
            ]
        },
        {
            "id": 3,
            "category": "Behavioral (STAR Method)",
            "question": "Tell us about a time you encountered a severe bug or project roadblock near a deadline. How did you resolve it?",
            "why_asked": "Tests problem-solving resilience, emotional composure under pressure, and systematic debugging methods.",
            "model_answer": "Use STAR: (S) Describe a project milestone with a tight deadline. (T) Identify the unexpected issue. (A) Explain your systematic diagnostic approach and how you communicated with teammates. (R) Share the successful resolution and post-mortem takeaway.",
            "key_points_to_include": [
                "Calm and structured root-cause analysis",
                "Clear communication with stakeholders/team",
                "Preventive testing or documentation added afterwards"
            ]
        },
        {
            "id": 4,
            "category": "Teamwork & Collaboration",
            "question": "How do you handle receiving critical code review feedback or differing architectural opinions from a colleague?",
            "why_asked": "Assesses coachability, ego management, and alignment with collaborative engineering culture.",
            "model_answer": "Emphasize that code reviews are collaborative opportunities to elevate codebase quality. Explain that you welcome objective critique, discuss trade-offs respectfully, and prioritize user outcomes over personal preferences.",
            "key_points_to_include": [
                "Receptive attitude towards constructive peer feedback",
                "Objective evaluation of trade-offs",
                "Focus on team velocity and high standards"
            ]
        },
        {
            "id": 5,
            "category": "Problem Solving & Learning",
            "question": f"Technology evolves rapidly. When you need to adopt a tool or framework you haven't mastered yet, what is your learning strategy?",
            "why_asked": "Measures self-directed learning velocity and technical curiosity.",
            "model_answer": "Outline a hands-on learning roadmap: studying official documentation, building a prototype to understand nuances, reviewing production open-source patterns, and seeking team mentorship.",
            "key_points_to_include": [
                "Active documentation study over passive reading",
                "Building small proofs-of-concept",
                "Rapid feedback loops and continuous improvement"
            ]
        }
    ]

    what_should_do = [
        f"Highlight your experience with {highlight_skill} using concrete project achievements and metrics.",
        f"Demonstrate genuine knowledge of {company_name}'s recent work, industry sector, and technical goals.",
        "Talk through your thinking process out loud when answering technical or design prompts.",
        "Frame every behavioral answer using the STAR methodology (Situation, Task, Action, Result).",
        "Maintain engaged body language, clear eye contact on camera, and professional vocal clarity.",
        "Send a thoughtful, personalized thank-you note within 24 hours of the interview."
    ]

    what_not_to_do = [
        "Do NOT speak negatively about past employers, professors, or former team members.",
        "Do NOT give vague, one-word or overly generalized answers without supporting examples.",
        f"Do NOT pretend to know technologies you haven't touched—be honest and articulate how you would learn them.",
        "Do NOT interrupt the interviewer while they are presenting a scenario or asking clarifying questions.",
        "Do NOT skip asking questions when given the opportunity at the end of the session."
    ]

    expert_advice = (
        f"{cand_name}, reaching the Interview stage for the {job_title} role at {company_name} "
        f"proves that your qualifications and application passed competitive screening. "
        f"The hiring team now wants to evaluate your problem-solving mentality, communication clarity, "
        f"and cultural alignment. Approach the discussion as a collaborative engineering conversation rather "
        f"than an interrogation. Be proud of your verified skills in {highlight_skill} and communicate your passion clearly."
    )

    questions_to_ask = [
        f"What does a typical sprint or engineering cycle look like for the {job_title} team at {company_name}?",
        "What are the highest-priority technical initiatives the team plans to tackle in the next 3 to 6 months?",
        "How does the engineering team measure success and impact for someone in this position?",
        "What opportunities exist within the company for mentorship, peer learning, and technical leadership?",
        "What are the next milestones in your hiring process following this interview?"
    ]

    return {
        "job_summary": {
            "title": job_title,
            "company_name": company_name,
            "location": job_data.get("location", "Cambodia"),
            "employment_type": job_data.get("employment_type", "Full-time"),
            "workplace_type": job_data.get("workplace_type", "On-site"),
            "required_skills": req_skills,
        },
        "role_overview": f"The {company_name} hiring panel is looking for a proactive {job_title} who combines practical proficiency in {primary_skill} with strong collaborative communication and structured problem solving.",
        "preparation_checklist": checklist,
        "likely_questions": likely_questions,
        "what_should_do": what_should_do,
        "what_not_to_do": what_not_to_do,
        "expert_advice": expert_advice,
        "questions_to_ask_interviewer": questions_to_ask,
    }


def get_or_generate_interview_prep(application, force_regenerate=False, custom_gemini_key=None):
    """
    Retrieves or generates interview preparation for an application.
    Persists results directly to the PostgreSQL database.
    """
    # Verify the application has reached the interview stage
    has_reached_interview = (
        application.status in [Application.Status.INTERVIEW, Application.Status.OFFERED]
        or application.interviews.exists()
    )
    if not has_reached_interview:
        return {
            "has_reached_interview": False,
            "detail": "Interview preparation becomes available once your application advances to the Interview stage."
        }, False

    # Check database cache unless forced regeneration is requested
    if not force_regenerate:
        existing = getattr(application, 'interview_prep', None)
        if existing and existing.prep_data and isinstance(existing.prep_data, dict):
            return existing.prep_data, existing.is_ai_generated

    # Build context
    job_data = build_job_context(application.job)
    candidate_data = build_candidate_context(application.candidate)

    # Resolve Gemini API key (priority: custom header -> candidate profile -> Django settings -> os.environ)
    candidate = application.candidate
    api_key = (
        custom_gemini_key
        or getattr(candidate, "gemini_api_key", "").strip()
        or getattr(settings, "GEMINI_API_KEY", "").strip()
    )

    prep_data = None
    is_gemini = False

    if api_key:
        try:
            g_prep = gemini_generate_interview_prep(job_data, candidate_data, api_key)
            if g_prep and isinstance(g_prep, dict) and "likely_questions" in g_prep:
                prep_data = g_prep
                is_gemini = True
                # Ensure job summary is present
                if "job_summary" not in prep_data:
                    prep_data["job_summary"] = {
                        "title": job_data["title"],
                        "company_name": job_data["company_name"],
                        "location": job_data["location"],
                        "employment_type": job_data["employment_type"],
                        "workplace_type": job_data["workplace_type"],
                        "required_skills": job_data["required_skills"],
                    }
        except Exception as e:
            logger.warning("Gemini interview prep generation failed for application %s: %s", application.id, e)

    # Fallback synthesizer if Gemini was not available or failed
    if not prep_data:
        prep_data = synthesize_fallback_interview_prep(job_data, candidate_data)
        is_gemini = False

    # Persist directly into the database
    prep_obj, _ = InterviewPreparation.objects.update_or_create(
        application=application,
        defaults={
            "prep_data": prep_data,
            "is_ai_generated": is_gemini,
        }
    )

    return prep_data, is_gemini

