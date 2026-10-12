import os
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.conf import settings
from django.core.files.base import ContentFile
from apps.accounts.models import User, CompanyProfile, CandidateProfile, CandidateSkill
from apps.jobs.models import Job, Skill, JobSkill
from apps.applications.models import Application, ApplicationStatusHistory, Interview, Offer, ApplicationNote
from apps.messaging.models import Message, Notification
from ._demo_tracker import DemoTracker


class Command(BaseCommand):
    help = "Seeds the CareerLens database with a realistic, repeatable demo dataset (Cambodian tech & IT roles)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--manifest",
            type=str,
            default=None,
            help="Optional path to a custom demo manifest file.",
        )

    def handle(self, *args, **options):
        manifest_path = options.get("manifest")
        tracker = DemoTracker(manifest_path=manifest_path)
        default_password = os.getenv("DEMO_USER_PASSWORD", "CareerLens2026!Demo")

        self.stdout.write(self.style.MIGRATE_HEADING("=== CareerLens Demo Data Seeding ==="))
        self.stdout.write(f"Environment: Safe demo seeding (Idempotent & non-destructive)")

        stats = {
            "created": 0,
            "already_present": 0,
            "skipped_unrelated": 0,
            "models": {},
        }

        def record_stat(model_name, action):
            if model_name not in stats["models"]:
                stats["models"][model_name] = {"created": 0, "already_present": 0, "skipped": 0}
            if action == "created":
                stats["created"] += 1
                stats["models"][model_name]["created"] += 1
            elif action == "already_present":
                stats["already_present"] += 1
                stats["models"][model_name]["already_present"] += 1
            elif action == "skipped":
                stats["skipped_unrelated"] += 1
                stats["models"][model_name]["skipped"] += 1

        with transaction.atomic():
            # ---------------------------------------------------------
            # 0. Ensure Demo Sample Resume file exists
            # ---------------------------------------------------------
            resume_content = (
                b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
                b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
                b"3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\n"
                b"xref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000053 00000 n \n0000000102 00000 n \n"
                b"trailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF\n"
            )
            resume_file_obj = ContentFile(resume_content, name="demo_candidate_resume.pdf")

            # ---------------------------------------------------------
            # 1. Demo Administrator Account
            # ---------------------------------------------------------
            admin_data = {
                "username": "demo_admin",
                "email": "demo.admin@careerlens.local",
                "first_name": "Demo",
                "last_name": "Administrator",
                "role": User.Role.ADMIN,
                "is_staff": True,
            }
            demo_admin = User.objects.filter(username=admin_data["username"]).first()
            if demo_admin:
                if tracker.is_instance_tracked(demo_admin):
                    record_stat("User", "already_present")
                else:
                    self.stdout.write(self.style.WARNING(f"Pre-existing user '{demo_admin.username}' found. Skipping adoption."))
                    record_stat("User", "skipped")
            else:
                demo_admin = User.objects.create_user(
                    username=admin_data["username"],
                    email=admin_data["email"],
                    password=default_password,
                    first_name=admin_data["first_name"],
                    last_name=admin_data["last_name"],
                    role=admin_data["role"],
                    is_staff=admin_data["is_staff"],
                )
                tracker.record_created(demo_admin, "demo_admin")
                record_stat("User", "created")

            # ---------------------------------------------------------
            # 2. Demo Company Accounts and Profiles (9 Total: 5 Real, 4 Fictional)
            # ---------------------------------------------------------
            companies_data = [
                # Real Cambodian Companies (Public factual data only, simulated vacancies)
                {
                    "username": "demo_comp_smart",
                    "email": "demo.smart@careerlens.local",
                    "first_name": "Smart",
                    "last_name": "Axiata",
                    "company_name": "Smart Axiata",
                    "industry": "Telecommunications & ICT",
                    "size": "1000+ employees",
                    "location": "Phnom Penh, Cambodia",
                    "website": "https://www.smart.com.kh",
                    "is_real": True,
                },
                {
                    "username": "demo_comp_cellcard",
                    "email": "demo.cellcard@careerlens.local",
                    "first_name": "Cellcard",
                    "last_name": "CamGSM",
                    "company_name": "Cellcard",
                    "industry": "Telecommunications & Digital Services",
                    "size": "500-1000 employees",
                    "location": "Phnom Penh, Cambodia",
                    "website": "https://www.cellcard.com.kh",
                    "is_real": True,
                },
                {
                    "username": "demo_comp_aba",
                    "email": "demo.aba@careerlens.local",
                    "first_name": "ABA",
                    "last_name": "Bank",
                    "company_name": "ABA Bank",
                    "industry": "Banking & Financial Services",
                    "size": "1000+ employees",
                    "location": "Phnom Penh, Cambodia",
                    "website": "https://www.ababank.com",
                    "is_real": True,
                },
                {
                    "username": "demo_comp_wing",
                    "email": "demo.wing@careerlens.local",
                    "first_name": "Wing",
                    "last_name": "Bank",
                    "company_name": "Wing Bank",
                    "industry": "Digital Banking & FinTech",
                    "size": "500-1000 employees",
                    "location": "Phnom Penh, Cambodia",
                    "website": "https://www.wingmoney.com",
                    "is_real": True,
                },
                {
                    "username": "demo_comp_1byte",
                    "email": "demo.1byte@careerlens.local",
                    "first_name": "1Byte",
                    "last_name": "Cloud",
                    "company_name": "1Byte",
                    "industry": "Cloud Hosting & Domain Services",
                    "size": "50-100 employees",
                    "location": "Phnom Penh, Cambodia",
                    "website": "https://1byte.com",
                    "is_real": True,
                },
                # Fictional Companies
                {
                    "username": "demo_comp_mekong",
                    "email": "demo.mekong@careerlens.local",
                    "first_name": "Mekong",
                    "last_name": "Digital",
                    "company_name": "Mekong Digital Labs",
                    "industry": "Software Engineering & Web Development",
                    "size": "20-50 employees",
                    "location": "Phnom Penh, Cambodia",
                    "website": "https://mekongdigitallabs.example.com",
                    "is_real": False,
                },
                {
                    "username": "demo_comp_khmercloud",
                    "email": "demo.khmercloud@careerlens.local",
                    "first_name": "KhmerCloud",
                    "last_name": "Solutions",
                    "company_name": "KhmerCloud Solutions",
                    "industry": "Cloud Architecture & DevOps",
                    "size": "10-30 employees",
                    "location": "Phnom Penh, Cambodia",
                    "website": "https://khmercloud.example.com",
                    "is_real": False,
                },
                {
                    "username": "demo_comp_angkor",
                    "email": "demo.angkor@careerlens.local",
                    "first_name": "Angkor",
                    "last_name": "AI",
                    "company_name": "Angkor AI Technologies",
                    "industry": "Artificial Intelligence & Data Analytics",
                    "size": "15-40 employees",
                    "location": "Siem Reap, Cambodia",
                    "website": "https://angkorai.example.com",
                    "is_real": False,
                },
                {
                    "username": "demo_comp_ppcyber",
                    "email": "demo.ppcyber@careerlens.local",
                    "first_name": "Phnom Penh",
                    "last_name": "CyberSec",
                    "company_name": "Phnom Penh CyberSec",
                    "industry": "Cybersecurity Consulting & Pen-Testing",
                    "size": "10-25 employees",
                    "location": "Phnom Penh, Cambodia",
                    "website": "https://ppcybersec.example.com",
                    "is_real": False,
                },
            ]

            company_profiles = {}
            for cdata in companies_data:
                uname = cdata["username"]
                user = User.objects.filter(username=uname).first()
                if user:
                    if tracker.is_instance_tracked(user):
                        record_stat("User", "already_present")
                    else:
                        self.stdout.write(self.style.WARNING(f"Pre-existing user '{uname}' found. Skipping adoption."))
                        record_stat("User", "skipped")
                        continue
                else:
                    user = User.objects.create_user(
                        username=uname,
                        email=cdata["email"],
                        password=default_password,
                        first_name=cdata["first_name"],
                        last_name=cdata["last_name"],
                        role=User.Role.COMPANY,
                    )
                    tracker.record_created(user, f"user_{uname}")
                    record_stat("User", "created")

                # Company Profile
                profile = CompanyProfile.objects.filter(user=user).first()
                if profile:
                    if tracker.is_instance_tracked(profile):
                        record_stat("CompanyProfile", "already_present")
                    else:
                        record_stat("CompanyProfile", "skipped")
                else:
                    profile = CompanyProfile.objects.create(
                        user=user,
                        company_name=cdata["company_name"],
                        industry=cdata["industry"],
                        size=cdata["size"],
                        location=cdata["location"],
                        website=cdata["website"],
                        verification_status=CompanyProfile.VerificationStatus.VERIFIED,
                    )
                    tracker.record_created(profile, f"profile_{uname}", {"is_real": cdata["is_real"]})
                    record_stat("CompanyProfile", "created")

                company_profiles[cdata["company_name"]] = profile

            # ---------------------------------------------------------
            # 3. Demo Candidate Accounts and Profiles (5 Total)
            # ---------------------------------------------------------
            candidates_data = [
                {
                    "username": "demo_cand_sreymom",
                    "email": "demo.sreymom@careerlens.local",
                    "first_name": "Sreymom",
                    "last_name": "Meas",
                    "university": "Royal University of Phnom Penh (RUPP)",
                    "major": "Computer Science",
                    "graduation_year": 2026,
                    "bio": "Passionate frontend developer interested in React, UI/UX design, and accessible web standards.",
                    "skills": [("JavaScript", "EXPERT"), ("React", "EXPERT"), ("CSS", "EXPERT"), ("HTML5", "EXPERT"), ("UI/UX Design", "INTERMEDIATE")],
                },
                {
                    "username": "demo_cand_vireak",
                    "email": "demo.vireak@careerlens.local",
                    "first_name": "Vireak",
                    "last_name": "Chan",
                    "university": "Cambodia Academy of Digital Technology (CADT)",
                    "major": "Computer Science & Software Engineering",
                    "graduation_year": 2025,
                    "bio": "Backend engineer building robust APIs with Python, Django, PostgreSQL, and Docker.",
                    "skills": [("Python", "EXPERT"), ("Django", "EXPERT"), ("PostgreSQL", "INTERMEDIATE"), ("Docker", "INTERMEDIATE"), ("REST APIs", "EXPERT")],
                },
                {
                    "username": "demo_cand_dara",
                    "email": "demo.dara@careerlens.local",
                    "first_name": "Dara",
                    "last_name": "Sok",
                    "university": "Institute of Technology of Cambodia (ITC)",
                    "major": "Data Science & Artificial Intelligence",
                    "graduation_year": 2025,
                    "bio": "Data enthusiast with experience in predictive modeling, PyTorch, Pandas, and data pipeline design.",
                    "skills": [("Python", "EXPERT"), ("Machine Learning", "EXPERT"), ("SQL", "INTERMEDIATE"), ("PyTorch", "INTERMEDIATE"), ("Data Analysis", "EXPERT")],
                },
                {
                    "username": "demo_cand_bopha",
                    "email": "demo.bopha@careerlens.local",
                    "first_name": "Bopha",
                    "last_name": "Keo",
                    "university": "Paragon International University",
                    "major": "Management Information Systems & Cybersecurity",
                    "graduation_year": 2026,
                    "bio": "Cybersecurity student focused on network defense, SIEM monitoring, and vulnerability assessment.",
                    "skills": [("Network Security", "EXPERT"), ("Linux", "EXPERT"), ("Wireshark", "INTERMEDIATE"), ("Cybersecurity", "EXPERT"), ("Python", "INTERMEDIATE")],
                },
                {
                    "username": "demo_cand_piseth",
                    "email": "demo.piseth@careerlens.local",
                    "first_name": "Piseth",
                    "last_name": "Lim",
                    "university": "National University of Management (NUM)",
                    "major": "Information Technology",
                    "graduation_year": 2027,
                    "bio": "Eager IT student seeking internship and junior opportunities in QA automation and technical support.",
                    "skills": [("Quality Assurance", "INTERMEDIATE"), ("Manual Testing", "INTERMEDIATE"), ("Git", "INTERMEDIATE"), ("Technical Support", "INTERMEDIATE"), ("JavaScript", "BEGINNER")],
                },
            ]

            candidate_profiles = {}
            for cand in candidates_data:
                uname = cand["username"]
                user = User.objects.filter(username=uname).first()
                if user:
                    if tracker.is_instance_tracked(user):
                        record_stat("User", "already_present")
                    else:
                        self.stdout.write(self.style.WARNING(f"Pre-existing user '{uname}' found. Skipping adoption."))
                        record_stat("User", "skipped")
                        continue
                else:
                    user = User.objects.create_user(
                        username=uname,
                        email=cand["email"],
                        password=default_password,
                        first_name=cand["first_name"],
                        last_name=cand["last_name"],
                        role=User.Role.CANDIDATE,
                    )
                    tracker.record_created(user, f"user_{uname}")
                    record_stat("User", "created")

                # Candidate Profile
                cprofile = CandidateProfile.objects.filter(user=user).first()
                if cprofile:
                    if tracker.is_instance_tracked(cprofile):
                        record_stat("CandidateProfile", "already_present")
                    else:
                        record_stat("CandidateProfile", "skipped")
                else:
                    cprofile = CandidateProfile.objects.create(
                        user=user,
                        university=cand["university"],
                        major=cand["major"],
                        graduation_year=cand["graduation_year"],
                        bio=cand["bio"],
                        resume_file=resume_file_obj,
                    )
                    tracker.record_created(cprofile, f"profile_{uname}")
                    record_stat("CandidateProfile", "created")

                candidate_profiles[uname] = cprofile

                # Candidate Skills
                for skill_name, prof_level in cand["skills"]:
                    skill_obj = Skill.objects.filter(name=skill_name).first()
                    if not skill_obj:
                        skill_obj = Skill.objects.create(name=skill_name)
                        tracker.record_created(skill_obj, f"skill_{skill_name}")
                        record_stat("Skill", "created")
                    else:
                        record_stat("Skill", "already_present" if tracker.is_instance_tracked(skill_obj) else "skipped")

                    cand_skill = CandidateSkill.objects.filter(candidate=cprofile, skill=skill_obj).first()
                    if cand_skill:
                        record_stat("CandidateSkill", "already_present" if tracker.is_instance_tracked(cand_skill) else "skipped")
                    else:
                        cand_skill = CandidateSkill.objects.create(
                            candidate=cprofile,
                            skill=skill_obj,
                            proficiency=prof_level,
                        )
                        tracker.record_created(cand_skill, f"candskill_{uname}_{skill_name}")
                        record_stat("CandidateSkill", "created")

            # ---------------------------------------------------------
            # 4. Demo Jobs Catalogue (Exactly 24 distinct listings)
            # ---------------------------------------------------------
            simulated_disclaimer = (
                "[SIMULATED DEMO VACANCY - FOR UNIVERSITY DEMONSTRATION PURPOSES ONLY]\n\n"
                "This posting is simulated demonstration content created for the CareerLens university project. "
                "It is not an actual job vacancy, and this company has not published, endorsed, or approved this listing.\n\n"
            )

            jobs_data = [
                # --- Software Development (6 roles) ---
                {
                    "company_name": "Mekong Digital Labs",
                    "title": "Frontend Developer",
                    "category": "Software Development",
                    "description": (
                        "We are seeking a talented Frontend Developer to build dynamic, responsive web interfaces "
                        "for modern digital platforms. You will work with React, modern CSS, and component systems."
                    ),
                    "location": "Phnom Penh",
                    "employment_type": Job.EmploymentType.FULL_TIME,
                    "workplace_type": Job.WorkplaceType.HYBRID,
                    "salary_min": 600,
                    "salary_max": 1100,
                    "status": Job.Status.PUBLISHED,
                    "skills": ["JavaScript", "React", "CSS", "HTML5"],
                },
                {
                    "company_name": "Wing Bank",
                    "title": "Backend Developer",
                    "category": "Software Development",
                    "description": simulated_disclaimer + (
                        "Join our digital banking engineering team to design and build highly scalable backend services, "
                        "manage transaction workflows, and optimize PostgreSQL databases."
                    ),
                    "location": "Phnom Penh",
                    "employment_type": Job.EmploymentType.FULL_TIME,
                    "workplace_type": Job.WorkplaceType.ON_SITE,
                    "salary_min": 900,
                    "salary_max": 1600,
                    "status": Job.Status.PUBLISHED,
                    "skills": ["Python", "Django", "PostgreSQL", "REST APIs"],
                },
                {
                    "company_name": "Mekong Digital Labs",
                    "title": "Full-Stack Developer",
                    "category": "Software Development",
                    "description": (
                        "Build full-stack web applications connecting modern React client interfaces with robust backend "
                        "services. Experience with relational databases and asynchronous APIs is highly valued."
                    ),
                    "location": "Phnom Penh",
                    "employment_type": Job.EmploymentType.FULL_TIME,
                    "workplace_type": Job.WorkplaceType.REMOTE,
                    "salary_min": 1000,
                    "salary_max": 1800,
                    "status": Job.Status.PUBLISHED,
                    "skills": ["React", "Python", "PostgreSQL", "REST APIs"],
                },
                {
                    "company_name": "ABA Bank",
                    "title": "Mobile App Developer",
                    "category": "Software Development",
                    "description": simulated_disclaimer + (
                        "Develop, test, and maintain customer-facing mobile applications with clean architecture, "
                        "secure API integrations, and smooth cross-platform user experience."
                    ),
                    "location": "Phnom Penh",
                    "employment_type": Job.EmploymentType.FULL_TIME,
                    "workplace_type": Job.WorkplaceType.ON_SITE,
                    "salary_min": 1200,
                    "salary_max": 2200,
                    "status": Job.Status.PUBLISHED,
                    "skills": ["Mobile Development", "REST APIs", "Git"],
                },
                {
                    "company_name": "KhmerCloud Solutions",
                    "title": "Software Engineer",
                    "category": "Software Development",
                    "description": (
                        "Deliver high-quality software solutions using containerized microservices, Python backends, "
                        "and modern CI/CD pipelines in a fast-paced agile development environment."
                    ),
                    "location": "Phnom Penh",
                    "employment_type": Job.EmploymentType.FULL_TIME,
                    "workplace_type": Job.WorkplaceType.HYBRID,
                    "salary_min": 800,
                    "salary_max": 1500,
                    "status": Job.Status.PUBLISHED,
                    "skills": ["Python", "Docker", "Git", "REST APIs"],
                },
                {
                    "company_name": "Mekong Digital Labs",
                    "title": "Junior Web Developer",
                    "category": "Software Development",
                    "description": (
                        "Great entry-level opportunity for recent university graduates to learn industry best practices, "
                        "collaborate on client projects, and maintain frontend web assets."
                    ),
                    "location": "Phnom Penh",
                    "employment_type": Job.EmploymentType.FULL_TIME,
                    "workplace_type": Job.WorkplaceType.ON_SITE,
                    "salary_min": 450,
                    "salary_max": 700,
                    "status": Job.Status.PUBLISHED,
                    "skills": ["JavaScript", "HTML5", "CSS", "Git"],
                },

                # --- Data and AI (5 roles) ---
                {
                    "company_name": "Angkor AI Technologies",
                    "title": "Data Analyst",
                    "category": "Data and AI",
                    "description": (
                        "Analyze structured datasets, identify key business trends, design KPI dashboards, and create "
                        "actionable analytical reports for regional partners."
                    ),
                    "location": "Siem Reap",
                    "employment_type": Job.EmploymentType.FULL_TIME,
                    "workplace_type": Job.WorkplaceType.HYBRID,
                    "salary_min": 600,
                    "salary_max": 1000,
                    "status": Job.Status.PUBLISHED,
                    "skills": ["SQL", "Python", "Data Analysis"],
                },
                {
                    "company_name": "Angkor AI Technologies",
                    "title": "Data Engineer",
                    "category": "Data and AI",
                    "description": (
                        "Architect reliable data ingestion pipelines, warehouse schemas, and ETL workflows using PostgreSQL, "
                        "Python, and containerized task orchestrators."
                    ),
                    "location": "Siem Reap",
                    "employment_type": Job.EmploymentType.FULL_TIME,
                    "workplace_type": Job.WorkplaceType.ON_SITE,
                    "salary_min": 1000,
                    "salary_max": 1800,
                    "status": Job.Status.PUBLISHED,
                    "skills": ["Python", "PostgreSQL", "Docker", "SQL"],
                },
                {
                    "company_name": "Angkor AI Technologies",
                    "title": "Machine Learning Engineer",
                    "category": "Data and AI",
                    "description": (
                        "Train, evaluate, and deploy predictive ML models into production API endpoints. Experience with PyTorch "
                        "and feature engineering pipelines is desired."
                    ),
                    "location": "Siem Reap",
                    "employment_type": Job.EmploymentType.FULL_TIME,
                    "workplace_type": Job.WorkplaceType.REMOTE,
                    "salary_min": 1200,
                    "salary_max": 2200,
                    "status": Job.Status.PUBLISHED,
                    "skills": ["Python", "Machine Learning", "PyTorch", "Data Analysis"],
                },
                {
                    "company_name": "Angkor AI Technologies",
                    "title": "AI Engineer",
                    "category": "Data and AI",
                    "description": (
                        "Implement natural language processing and computer vision prototypes, fine-tune transformer models, "
                        "and package AI microservices for client deployments."
                    ),
                    "location": "Siem Reap",
                    "employment_type": Job.EmploymentType.FULL_TIME,
                    "workplace_type": Job.WorkplaceType.ON_SITE,
                    "salary_min": 1300,
                    "salary_max": 2400,
                    "status": Job.Status.PUBLISHED,
                    "skills": ["Python", "Machine Learning", "Deep Learning", "REST APIs"],
                },
                {
                    "company_name": "Phnom Penh CyberSec",
                    "title": "Business Intelligence Analyst",
                    "category": "Data and AI",
                    "description": (
                        "Transform raw operational telemetry and security incident metrics into executive summaries, "
                        "automated reports, and interactive intelligence dashboards."
                    ),
                    "location": "Phnom Penh",
                    "employment_type": Job.EmploymentType.FULL_TIME,
                    "workplace_type": Job.WorkplaceType.HYBRID,
                    "salary_min": 700,
                    "salary_max": 1200,
                    "status": Job.Status.PUBLISHED,
                    "skills": ["SQL", "Data Analysis", "Python"],
                },

                # --- Cybersecurity and Networking (5 roles) ---
                {
                    "company_name": "Cellcard",
                    "title": "Cybersecurity Analyst",
                    "category": "Cybersecurity and Networking",
                    "description": simulated_disclaimer + (
                        "Monitor security operations center (SOC) alerts, investigate anomalous activity, configure intrusion "
                        "detection signatures, and conduct periodic vulnerability reviews."
                    ),
                    "location": "Phnom Penh",
                    "employment_type": Job.EmploymentType.FULL_TIME,
                    "workplace_type": Job.WorkplaceType.ON_SITE,
                    "salary_min": 800,
                    "salary_max": 1500,
                    "status": Job.Status.PUBLISHED,
                    "skills": ["Cybersecurity", "Network Security", "Linux"],
                },
                {
                    "company_name": "Smart Axiata",
                    "title": "Network Engineer",
                    "category": "Cybersecurity and Networking",
                    "description": simulated_disclaimer + (
                        "Maintain telecom routing, switching, IP core infrastructure, and enterprise network connectivity "
                        "ensuring 99.99% carrier-grade service reliability."
                    ),
                    "location": "Phnom Penh",
                    "employment_type": Job.EmploymentType.FULL_TIME,
                    "workplace_type": Job.WorkplaceType.ON_SITE,
                    "salary_min": 900,
                    "salary_max": 1600,
                    "status": Job.Status.PUBLISHED,
                    "skills": ["Network Security", "Linux", "Wireshark"],
                },
                {
                    "company_name": "Cellcard",
                    "title": "IT Support Engineer",
                    "category": "Cybersecurity and Networking",
                    "description": simulated_disclaimer + (
                        "Provide tier-2 hardware, operating system, and network troubleshooting for internal staff and operations. "
                        "Maintain workstations, active directory accounts, and network access."
                    ),
                    "location": "Phnom Penh",
                    "employment_type": Job.EmploymentType.FULL_TIME,
                    "workplace_type": Job.WorkplaceType.ON_SITE,
                    "salary_min": 500,
                    "salary_max": 850,
                    "status": Job.Status.PUBLISHED,
                    "skills": ["Technical Support", "Linux", "Network Security"],
                },
                {
                    "company_name": "ABA Bank",
                    "title": "Security Engineer",
                    "category": "Cybersecurity and Networking",
                    "description": simulated_disclaimer + (
                        "Design defensive security architectures, implement encryption standards, review application security "
                        "code, and harden financial transaction gateways."
                    ),
                    "location": "Phnom Penh",
                    "employment_type": Job.EmploymentType.FULL_TIME,
                    "workplace_type": Job.WorkplaceType.ON_SITE,
                    "salary_min": 1400,
                    "salary_max": 2500,
                    "status": Job.Status.PUBLISHED,
                    "skills": ["Cybersecurity", "Network Security", "Linux"],
                },
                {
                    "company_name": "Smart Axiata",
                    "title": "System Administrator",
                    "category": "Cybersecurity and Networking",
                    "description": simulated_disclaimer + (
                        "Oversee enterprise server operating environments, manage virtualization clusters, coordinate data backups, "
                        "and enforce system patch management schedules."
                    ),
                    "location": "Phnom Penh",
                    "employment_type": Job.EmploymentType.FULL_TIME,
                    "workplace_type": Job.WorkplaceType.HYBRID,
                    "salary_min": 850,
                    "salary_max": 1400,
                    "status": Job.Status.PUBLISHED,
                    "skills": ["Linux", "Technical Support", "Docker"],
                },

                # --- Cloud and Quality Assurance (4 roles) ---
                {
                    "company_name": "Wing Bank",
                    "title": "DevOps Engineer",
                    "category": "Cloud and QA",
                    "description": simulated_disclaimer + (
                        "Automate continuous deployment pipelines, maintain Kubernetes cluster configurations, and monitor "
                        "banking service reliability and latency."
                    ),
                    "location": "Phnom Penh",
                    "employment_type": Job.EmploymentType.FULL_TIME,
                    "workplace_type": Job.WorkplaceType.HYBRID,
                    "salary_min": 1100,
                    "salary_max": 2000,
                    "status": Job.Status.PUBLISHED,
                    "skills": ["Docker", "Linux", "REST APIs"],
                },
                {
                    "company_name": "1Byte",
                    "title": "Cloud Engineer",
                    "category": "Cloud and QA",
                    "description": simulated_disclaimer + (
                        "Support customer cloud infrastructure provisioning, virtual private server management, and automated "
                        "DNS/SSL certificates in a 24/7 web hosting environment."
                    ),
                    "location": "Phnom Penh",
                    "employment_type": Job.EmploymentType.FULL_TIME,
                    "workplace_type": Job.WorkplaceType.HYBRID,
                    "salary_min": 900,
                    "salary_max": 1700,
                    "status": Job.Status.PUBLISHED,
                    "skills": ["Linux", "Docker", "Network Security"],
                },
                {
                    "company_name": "KhmerCloud Solutions",
                    "title": "QA Engineer",
                    "category": "Cloud and QA",
                    "description": (
                        "Develop automated end-to-end and API integration tests, write comprehensive test specifications, and "
                        "collaborate closely with developers to ensure software stability."
                    ),
                    "location": "Phnom Penh",
                    "employment_type": Job.EmploymentType.FULL_TIME,
                    "workplace_type": Job.WorkplaceType.REMOTE,
                    "salary_min": 600,
                    "salary_max": 1100,
                    "status": Job.Status.PUBLISHED,
                    "skills": ["Quality Assurance", "Python", "Git"],
                },
                {
                    "company_name": "KhmerCloud Solutions",
                    "title": "Software Tester",
                    "category": "Cloud and QA",
                    "description": (
                        "Conduct functional regression testing, document edge-case anomalies, and maintain user-story validation "
                        "checklists for client delivery cycles."
                    ),
                    "location": "Phnom Penh",
                    "employment_type": Job.EmploymentType.FULL_TIME,
                    "workplace_type": Job.WorkplaceType.ON_SITE,
                    "salary_min": 450,
                    "salary_max": 750,
                    "status": Job.Status.PUBLISHED,
                    "skills": ["Manual Testing", "Quality Assurance", "Git"],
                },

                # --- Other IT Roles (4 roles) ---
                {
                    "company_name": "1Byte",
                    "title": "Database Administrator",
                    "category": "Other IT Roles",
                    "description": simulated_disclaimer + (
                        "Manage relational database performance tuning, replication sets, backup strategies, and index "
                        "optimization across shared hosting servers."
                    ),
                    "location": "Phnom Penh",
                    "employment_type": Job.EmploymentType.FULL_TIME,
                    "workplace_type": Job.WorkplaceType.ON_SITE,
                    "salary_min": 1000,
                    "salary_max": 1800,
                    "status": Job.Status.PUBLISHED,
                    "skills": ["PostgreSQL", "SQL", "Linux"],
                },
                {
                    "company_name": "Mekong Digital Labs",
                    "title": "UI/UX Designer",
                    "category": "Other IT Roles",
                    "description": (
                        "Craft intuitive user experiences, design accessible web and mobile wireframes, conduct user research, "
                        "and build cohesive design system tokens."
                    ),
                    "location": "Phnom Penh",
                    "employment_type": Job.EmploymentType.FULL_TIME,
                    "workplace_type": Job.WorkplaceType.HYBRID,
                    "salary_min": 650,
                    "salary_max": 1200,
                    "status": Job.Status.PUBLISHED,
                    "skills": ["UI/UX Design", "CSS", "HTML5"],
                },
                {
                    "company_name": "Phnom Penh CyberSec",
                    "title": "Technical Support Specialist",
                    "category": "Other IT Roles",
                    "description": (
                        "Assist clients with technical software setup, endpoint antivirus configurations, account permissions, "
                        "and basic network connectivity troubleshooting."
                    ),
                    "location": "Phnom Penh",
                    "employment_type": Job.EmploymentType.FULL_TIME,
                    "workplace_type": Job.WorkplaceType.ON_SITE,
                    "salary_min": 400,
                    "salary_max": 650,
                    "status": Job.Status.PUBLISHED,
                    "skills": ["Technical Support", "Linux", "Git"],
                },
                {
                    "company_name": "Phnom Penh CyberSec",
                    "title": "IT Intern",
                    "category": "Other IT Roles",
                    "description": (
                        "Internship role tailored for university students interested in IT infrastructure, cybersecurity basics, "
                        "and practical systems administration experience."
                    ),
                    "location": "Phnom Penh",
                    "employment_type": Job.EmploymentType.INTERNSHIP,
                    "workplace_type": Job.WorkplaceType.ON_SITE,
                    "salary_min": 200,
                    "salary_max": 350,
                    "status": Job.Status.PUBLISHED,
                    "skills": ["Git", "Linux", "Technical Support"],
                },
            ]

            seeded_jobs = {}
            for jdata in jobs_data:
                cprofile = company_profiles.get(jdata["company_name"])
                if not cprofile:
                    self.stdout.write(self.style.ERROR(f"Company profile not found for {jdata['company_name']}"))
                    continue

                demo_key = f"job_{cprofile.user.username}_{jdata['title'].lower().replace(' ', '_')}"
                job = Job.objects.filter(company=cprofile, title=jdata["title"]).first()
                if job:
                    if tracker.is_instance_tracked(job):
                        record_stat("Job", "already_present")
                    else:
                        self.stdout.write(self.style.WARNING(f"Pre-existing job '{job.title}' found. Skipping adoption."))
                        record_stat("Job", "skipped")
                        continue
                else:
                    job = Job.objects.create(
                        company=cprofile,
                        title=jdata["title"],
                        description=jdata["description"],
                        location=jdata["location"],
                        employment_type=jdata["employment_type"],
                        workplace_type=jdata["workplace_type"],
                        salary_min=jdata["salary_min"],
                        salary_max=jdata["salary_max"],
                        status=jdata["status"],
                        deadline=timezone.now() + timezone.timedelta(days=45),
                    )
                    tracker.record_created(job, demo_key, {"company": cprofile.company_name, "category": jdata["category"]})
                    record_stat("Job", "created")

                seeded_jobs[(jdata["company_name"], jdata["title"])] = job

                # Attach skills via JobSkill
                for sname in jdata["skills"]:
                    skill_obj = Skill.objects.filter(name=sname).first()
                    if not skill_obj:
                        skill_obj = Skill.objects.create(name=sname)
                        tracker.record_created(skill_obj, f"skill_{sname}")
                        record_stat("Skill", "created")

                    jskill = JobSkill.objects.filter(job=job, skill=skill_obj).first()
                    if jskill:
                        record_stat("JobSkill", "already_present" if tracker.is_instance_tracked(jskill) else "skipped")
                    else:
                        jskill = JobSkill.objects.create(job=job, skill=skill_obj)
                        tracker.record_created(jskill, f"jskill_{job.id}_{skill_obj.id}")
                        record_stat("JobSkill", "created")

            # ---------------------------------------------------------
            # 5. Demo Applications (14 Realistic Applications across 5 Candidates)
            # ---------------------------------------------------------
            applications_plan = [
                # Sreymom Meas (Frontend / UI/UX)
                {
                    "cand_uname": "demo_cand_sreymom",
                    "company_name": "Mekong Digital Labs",
                    "job_title": "Frontend Developer",
                    "status": Application.Status.INTERVIEW,
                    "cover_letter": "I have built interactive React applications and would love to contribute to Mekong Digital Labs.",
                    "interview": {
                        "scheduled_days": 3,
                        "link": "https://meet.google.com/abc-demo-fnt",
                        "location": "Online Google Meet",
                        "status": Interview.Status.SCHEDULED,
                    },
                    "note": "Candidate demonstrated solid grasp of React component lifecycle.",
                },
                {
                    "cand_uname": "demo_cand_sreymom",
                    "company_name": "Mekong Digital Labs",
                    "job_title": "UI/UX Designer",
                    "status": Application.Status.OFFERED,
                    "cover_letter": "My design portfolio demonstrates user-centric wireframing and design systems.",
                    "offer": {
                        "salary": 750,
                        "currency": "USD",
                        "status": Offer.Status.ACCEPTED,
                        "message": "Congratulations Sreymom! We are delighted to extend this offer for the UI/UX Designer role.",
                    },
                },
                {
                    "cand_uname": "demo_cand_sreymom",
                    "company_name": "Mekong Digital Labs",
                    "job_title": "Junior Web Developer",
                    "status": Application.Status.APPLIED,
                    "cover_letter": "Applying as an alternative position matching my frontend foundation.",
                },

                # Vireak Chan (Backend / DevOps)
                {
                    "cand_uname": "demo_cand_vireak",
                    "company_name": "Wing Bank",
                    "job_title": "Backend Developer",
                    "status": Application.Status.REVIEWING,
                    "cover_letter": "I specialize in Django REST Framework and high-integrity database transactions.",
                    "note": "Reviewing candidate's GitHub portfolio and open source commits.",
                },
                {
                    "cand_uname": "demo_cand_vireak",
                    "company_name": "Wing Bank",
                    "job_title": "DevOps Engineer",
                    "status": Application.Status.INTERVIEW,
                    "cover_letter": "Passionate about container orchestration with Docker and automated testing.",
                    "interview": {
                        "scheduled_days": 4,
                        "link": "https://meet.google.com/devops-demo-wng",
                        "location": "Online Google Meet",
                        "status": Interview.Status.SCHEDULED,
                    },
                },
                {
                    "cand_uname": "demo_cand_vireak",
                    "company_name": "1Byte",
                    "job_title": "Cloud Engineer",
                    "status": Application.Status.APPLIED,
                    "cover_letter": "Experienced with Linux server administration and cloud provisioning.",
                },

                # Dara Sok (Data & AI)
                {
                    "cand_uname": "demo_cand_dara",
                    "company_name": "Angkor AI Technologies",
                    "job_title": "Machine Learning Engineer",
                    "status": Application.Status.OFFERED,
                    "cover_letter": "Have trained PyTorch models and engineered data pipelines for research projects.",
                    "offer": {
                        "salary": 1400,
                        "currency": "USD",
                        "status": Offer.Status.PENDING,
                        "message": "We were very impressed by your machine learning presentation and offer you the position.",
                    },
                },
                {
                    "cand_uname": "demo_cand_dara",
                    "company_name": "Angkor AI Technologies",
                    "job_title": "Data Analyst",
                    "status": Application.Status.APPLIED,
                    "cover_letter": "Strong foundation in SQL querying, statistical data analysis, and dashboard generation.",
                },
                {
                    "cand_uname": "demo_cand_dara",
                    "company_name": "Angkor AI Technologies",
                    "job_title": "AI Engineer",
                    "status": Application.Status.REVIEWING,
                    "cover_letter": "Eager to deploy LLM applications and deep learning pipelines in production.",
                },

                # Bopha Keo (Cybersecurity)
                {
                    "cand_uname": "demo_cand_bopha",
                    "company_name": "Cellcard",
                    "job_title": "Cybersecurity Analyst",
                    "status": Application.Status.INTERVIEW,
                    "cover_letter": "Trained in packet analysis, vulnerability management, and defensive incident response.",
                    "interview": {
                        "scheduled_days": 5,
                        "link": "https://meet.google.com/sec-demo-ccard",
                        "location": "Online Google Meet",
                        "status": Interview.Status.SCHEDULED,
                    },
                },
                {
                    "cand_uname": "demo_cand_bopha",
                    "company_name": "ABA Bank",
                    "job_title": "Security Engineer",
                    "status": Application.Status.REVIEWING,
                    "cover_letter": "Focused on banking application security and vulnerability defense.",
                },
                {
                    "cand_uname": "demo_cand_bopha",
                    "company_name": "Cellcard",
                    "job_title": "IT Support Engineer",
                    "status": Application.Status.REJECTED,
                    "cover_letter": "Entry-level technical support application.",
                    "note": "Candidate profile is overqualified for basic support; redirected to Security team.",
                },

                # Piseth Lim (QA & Support)
                {
                    "cand_uname": "demo_cand_piseth",
                    "company_name": "Phnom Penh CyberSec",
                    "job_title": "IT Intern",
                    "status": Application.Status.APPLIED,
                    "cover_letter": "Enthusiastic 2nd-year IT student seeking hands-on learning.",
                },
                {
                    "cand_uname": "demo_cand_piseth",
                    "company_name": "KhmerCloud Solutions",
                    "job_title": "Software Tester",
                    "status": Application.Status.REVIEWING,
                    "cover_letter": "Dedicated to quality assurance, testing checklists, and reporting reproducible bugs.",
                },
            ]

            for plan in applications_plan:
                cprofile = candidate_profiles.get(plan["cand_uname"])
                job = seeded_jobs.get((plan["company_name"], plan["job_title"]))
                if not cprofile or not job:
                    continue

                app_key = f"app_{cprofile.user.username}_{job.id}"
                application = Application.objects.filter(candidate=cprofile, job=job).first()
                if application:
                    if tracker.is_instance_tracked(application):
                        record_stat("Application", "already_present")
                    else:
                        record_stat("Application", "skipped")
                        continue
                else:
                    application = Application.objects.create(
                        candidate=cprofile,
                        job=job,
                        status=plan["status"],
                        cover_letter=plan.get("cover_letter", ""),
                        resume_file=resume_file_obj,
                    )
                    tracker.record_created(application, app_key)
                    record_stat("Application", "created")

                    # Status History
                    hist = ApplicationStatusHistory.objects.create(
                        application=application,
                        changed_by=job.company.user,
                        old_status=Application.Status.APPLIED,
                        new_status=plan["status"],
                        note=f"Status set during demonstration seed setup to {plan['status']}",
                    )
                    tracker.record_created(hist, f"hist_{application.id}")
                    record_stat("ApplicationStatusHistory", "created")

                # Optional Interview
                if "interview" in plan:
                    int_data = plan["interview"]
                    interview = Interview.objects.filter(application=application).first()
                    if interview:
                        record_stat("Interview", "already_present" if tracker.is_instance_tracked(interview) else "skipped")
                    else:
                        interview = Interview.objects.create(
                            application=application,
                            scheduled_by=job.company.user,
                            scheduled_at=timezone.now() + timezone.timedelta(days=int_data["scheduled_days"]),
                            meeting_link=int_data.get("link", ""),
                            location=int_data.get("location", "Online"),
                            status=int_data.get("status", Interview.Status.SCHEDULED),
                            feedback="Technical interview session scheduled for candidate evaluation.",
                        )
                        tracker.record_created(interview, f"interview_{application.id}")
                        record_stat("Interview", "created")

                # Optional Offer
                if "offer" in plan:
                    off_data = plan["offer"]
                    offer = Offer.objects.filter(application=application).first()
                    if offer:
                        record_stat("Offer", "already_present" if tracker.is_instance_tracked(offer) else "skipped")
                    else:
                        offer = Offer.objects.create(
                            application=application,
                            salary=off_data["salary"],
                            currency=off_data.get("currency", "USD"),
                            message=off_data.get("message", ""),
                            status=off_data.get("status", Offer.Status.PENDING),
                        )
                        tracker.record_created(offer, f"offer_{application.id}")
                        record_stat("Offer", "created")

                # Optional Note
                if "note" in plan:
                    note_obj = ApplicationNote.objects.filter(application=application).first()
                    if note_obj:
                        record_stat("ApplicationNote", "already_present" if tracker.is_instance_tracked(note_obj) else "skipped")
                    else:
                        note_obj = ApplicationNote.objects.create(
                            application=application,
                            author=job.company.user,
                            note=plan["note"],
                        )
                        tracker.record_created(note_obj, f"note_{application.id}")
                        record_stat("ApplicationNote", "created")

            # ---------------------------------------------------------
            # 6. Demo Messages & Conversations (4 Conversations, 9 Messages)
            # ---------------------------------------------------------
            conversations_plan = [
                # Conv 1: Mekong Digital Labs Recruiter <-> Sreymom Meas
                {
                    "company_uname": "demo_comp_mekong",
                    "cand_uname": "demo_cand_sreymom",
                    "messages": [
                        ("comp", "Hello Sreymom, thank you for applying to the Frontend Developer position at Mekong Digital Labs. We were impressed with your portfolio!"),
                        ("cand", "Thank you for reaching out! I'm very excited about the opportunity and look forward to discussing how I can contribute."),
                        ("comp", "We would like to invite you for a technical interview this Thursday. Does 2:00 PM work for you?"),
                    ],
                },
                # Conv 2: Wing Bank Recruiter <-> Vireak Chan
                {
                    "company_uname": "demo_comp_wing",
                    "cand_uname": "demo_cand_vireak",
                    "messages": [
                        ("comp", "Hi Vireak, our backend engineering team is reviewing your application for the Backend Developer position."),
                        ("cand", "Thank you! Please let me know if you need any additional sample projects or references."),
                    ],
                },
                # Conv 3: Angkor AI Recruiter <-> Dara Sok
                {
                    "company_uname": "demo_comp_angkor",
                    "cand_uname": "demo_cand_dara",
                    "messages": [
                        ("comp", "Hi Dara, congratulations! Following your technical round, we are pleased to extend an offer for the Machine Learning Engineer role."),
                        ("cand", "Thank you so much! I am thrilled to receive the offer and will review the details promptly."),
                    ],
                },
                # Conv 4: Cellcard Recruiter <-> Bopha Keo
                {
                    "company_uname": "demo_comp_cellcard",
                    "cand_uname": "demo_cand_bopha",
                    "messages": [
                        ("comp", "Hello Bopha, our security operations team would like to schedule an initial interview regarding the Cybersecurity Analyst role."),
                        ("cand", "Thank you for the update! I am available any afternoon this week."),
                    ],
                },
            ]

            for conv in conversations_plan:
                comp_user = User.objects.filter(username=conv["company_uname"]).first()
                cand_user = User.objects.filter(username=conv["cand_uname"]).first()
                if not comp_user or not cand_user:
                    continue

                for idx, (sender_role, text) in enumerate(conv["messages"]):
                    sender = comp_user if sender_role == "comp" else cand_user
                    recipient = cand_user if sender_role == "comp" else comp_user

                    msg_key = f"msg_{sender.username}_{recipient.username}_{idx}"
                    msg = Message.objects.filter(sender=sender, recipient=recipient, text=text).first()
                    if msg:
                        record_stat("Message", "already_present" if tracker.is_instance_tracked(msg) else "skipped")
                    else:
                        msg = Message.objects.create(
                            sender=sender,
                            recipient=recipient,
                            text=text,
                        )
                        tracker.record_created(msg, msg_key)
                        record_stat("Message", "created")

                # Corresponding Notifications
                notif_key = f"notif_{cand_user.username}_interview"
                notif_msg = "You have a new recruitment notification regarding your active application."
                notif = Notification.objects.filter(user=cand_user, message=notif_msg).first()
                if notif:
                    record_stat("Notification", "already_present" if tracker.is_instance_tracked(notif) else "skipped")
                else:
                    notif = Notification.objects.create(
                        user=cand_user,
                        message=notif_msg,
                        type=Notification.Type.INFO,
                    )
                    tracker.record_created(notif, notif_key)
                    record_stat("Notification", "created")

            # Persist local manifest file mirror
            tracker.save_manifest()

        # ---------------------------------------------------------
        # Final Summary Output
        # ---------------------------------------------------------
        self.stdout.write(self.style.SUCCESS("\n[SUCCESS] Demo seeding completed successfully!"))
        self.stdout.write("---------------------------------------------------------")
        self.stdout.write(f"Total Newly Created Records  : {stats['created']}")
        self.stdout.write(f"Total Already Present Records: {stats['already_present']}")
        self.stdout.write(f"Total Unrelated Skipped      : {stats['skipped_unrelated']}")
        self.stdout.write("---------------------------------------------------------")
        self.stdout.write("Model Breakdown:")
        for mname, mcounts in stats["models"].items():
            self.stdout.write(
                f"  - {mname:<25}: Created {mcounts['created']}, "
                f"Already Present {mcounts['already_present']}, "
                f"Skipped {mcounts['skipped']}"
            )
        self.stdout.write("---------------------------------------------------------")
        self.stdout.write(f"Tracked Demo Jobs Count: {Job.objects.filter(pk__in=tracker.get_tracked_pks_for_model('jobs', 'Job')).count()} (Target: 24)")
        self.stdout.write(f"Tracked Demo Companies : {CompanyProfile.objects.filter(pk__in=tracker.get_tracked_pks_for_model('accounts', 'CompanyProfile')).count()} (Target: 9)")
        self.stdout.write(f"Tracked Demo Candidates: {CandidateProfile.objects.filter(pk__in=tracker.get_tracked_pks_for_model('accounts', 'CandidateProfile')).count()} (Target: 5)")
        self.stdout.write("---------------------------------------------------------")
        self.stdout.write(f"Manifest mirror saved to: {tracker.manifest_path}")
        self.stdout.write(f"Default demo user password: [CONFIGURED IN ENVIRONMENT]")
