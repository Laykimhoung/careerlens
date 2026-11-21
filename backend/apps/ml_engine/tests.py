from django.test import TestCase
from apps.ml_engine.normalizer import (
    normalize_skill_name,
    normalize_skill_set,
    clean_text,
    extract_skills_from_text,
    CANONICAL_SKILL_MAP,
)


class NormalizerTests(TestCase):
    def test_canonical_skill_name_aliases(self):
        self.assertEqual(normalize_skill_name("js"), "JavaScript")
        self.assertEqual(normalize_skill_name("React.js"), "React")
        self.assertEqual(normalize_skill_name("reactjs"), "React")
        self.assertEqual(normalize_skill_name("drf"), "Django REST Framework")
        self.assertEqual(normalize_skill_name("postgres"), "PostgreSQL")
        self.assertEqual(normalize_skill_name("k8s"), "Kubernetes")
        self.assertEqual(normalize_skill_name("py"), "Python")
        self.assertEqual(normalize_skill_name("ml"), "Machine Learning")

    def test_unknown_skill_preservation(self):
        self.assertEqual(normalize_skill_name("Quantum Computing"), "Quantum Computing")
        self.assertEqual(normalize_skill_name(""), "")

    def test_normalize_skill_set(self):
        raw_list = ["js", "React.js", "javascript", "Python", "PY", "Django"]
        normalized = normalize_skill_set(raw_list)
        # Should deduplicate JavaScript and Python
        self.assertEqual(normalized, ["JavaScript", "React", "Python", "Django"])

    def test_clean_text(self):
        html_text = "<p>Experienced in <b>Python</b> &amp; <i>Django</i>.</p>"
        cleaned = clean_text(html_text)
        self.assertEqual(cleaned, "Experienced in Python & Django.")

    def test_extract_skills_from_text(self):
        resume_text = """
        Software engineer experienced with building web applications using React,
        TypeScript, and Django REST framework. Proficient with PostgreSQL and Docker.
        """
        extracted = extract_skills_from_text(resume_text)
        self.assertIn("React", extracted)
        self.assertIn("TypeScript", extracted)
        self.assertIn("Django REST Framework", extracted)
        self.assertIn("PostgreSQL", extracted)
        self.assertIn("Docker", extracted)


class FeatureExtractionTests(TestCase):
    def test_extract_features_shape_and_bounds(self):
        from apps.ml_engine.features import extract_features_from_dict, FEATURE_NAMES

        cand = {
            "university": "Royal University of Phnom Penh",
            "major": "Computer Science",
            "graduation_year": 2025,
            "bio": "Frontend developer with experience in React and JavaScript.",
            "skills": [
                {"name": "React", "proficiency": "EXPERT"},
                {"name": "JavaScript", "proficiency": "EXPERT"},
                {"name": "HTML5", "proficiency": "INTERMEDIATE"},
            ],
            "resume_file": True,
        }
        job = {
            "title": "Junior React Developer",
            "description": "Looking for a junior React developer to build web components.",
            "location": "Phnom Penh",
            "employment_type": "FULL_TIME",
            "workplace_type": "ON_SITE",
            "min_experience_years": 1,
            "required_skills": ["React", "JavaScript", "CSS3"],
        }
        prefs = {
            "target_role": "React Developer",
            "preferred_location": "Phnom Penh",
            "preferred_employment_type": "FULL_TIME",
            "preferred_workplace_type": "ON_SITE",
        }

        vec, feat_dict = extract_features_from_dict(cand, job, prefs)
        self.assertEqual(len(vec), 15)
        self.assertEqual(len(vec), len(FEATURE_NAMES))
        # Ensure no NaNs or Infinities
        for val in vec:
            self.assertFalse(val is None)
            self.assertGreaterEqual(float(val), 0.0)
            self.assertLessEqual(float(val), 1.0)

        # React and JavaScript match 2 out of 3 required skills
        self.assertAlmostEqual(feat_dict["skill_jaccard_ratio"], 2.0 / 3.0, places=2)
        # Location and workplace match
        self.assertEqual(feat_dict["location_compatibility"], 1.0)
        self.assertEqual(feat_dict["workplace_compatibility"], 1.0)
        self.assertEqual(feat_dict["employment_type_match"], 1.0)


class ExplainabilityTests(TestCase):
    def test_explainer_payload_structure_and_bounds(self):
        from apps.ml_engine.explainer import generate_explanation_payload

        cand_skills = [
            {"name": "Python", "proficiency": "EXPERT"},
            {"name": "Django", "proficiency": "EXPERT"},
        ]
        job_skills = [
            {"name": "Python", "is_required": True},
            {"name": "Django", "is_required": True},
            {"name": "Docker", "is_required": True},
        ]
        feat_dict = {
            "sim_skills": 0.85,
            "skill_jaccard_ratio": 0.67,
            "proficiency_weighted_score": 0.90,
            "sim_experience": 0.80,
            "experience_compatibility": 1.0,
            "sim_title_role": 0.85,
            "education_alignment": 0.90,
            "profile_completeness": 0.95,
            "location_compatibility": 1.0,
            "workplace_compatibility": 1.0,
            "employment_type_match": 1.0,
        }

        payload = generate_explanation_payload(
            candidate_skills=cand_skills,
            job_skills=job_skills,
            job_title="Senior Backend Engineer",
            company_name="Tech Innovations",
            candidate_major="Computer Science",
            calibrated_score=85,
            feature_dict=feat_dict,
            has_resume=True,
            target_role="Backend Engineer",
        )

        self.assertEqual(payload["match_score"], 85)
        self.assertEqual(payload["fit_verdict"], "Exceptional Match")
        self.assertIn("Python", payload["matching_skills"])
        self.assertIn("Django", payload["matching_skills"])
        self.assertIn("Docker", payload["missing_skills"])
        self.assertIn("Tech Innovations", payload["explanation"])
        self.assertGreaterEqual(len(payload["improvement_suggestions"]), 1)

        breakdown = payload["score_breakdown"]
        self.assertIn("skills_score", breakdown)
        self.assertIn("experience_score", breakdown)
        self.assertIn("education_score", breakdown)
        self.assertIn("projects_score", breakdown)
        self.assertIn("preferences_score", breakdown)
        self.assertLessEqual(breakdown["skills_score"], breakdown["skills_max"])
        self.assertLessEqual(breakdown["experience_score"], breakdown["experience_max"])
        self.assertLessEqual(breakdown["education_score"], breakdown["education_max"])
        self.assertLessEqual(breakdown["projects_score"], breakdown["projects_max"])
        self.assertLessEqual(breakdown["preferences_score"], breakdown["preferences_max"])


class CoreMatchingServiceIntegrationTests(TestCase):
    def setUp(self):
        from apps.accounts.models import User, CandidateProfile, CompanyProfile, CandidateSkill
        from apps.jobs.models import Job, Skill, JobSkill

        # Candidate user & profile
        self.cand_user = User.objects.create_user(
            username="candidate_ml_test",
            email="candidate_ml@test.com",
            password="testpassword123",
            role=User.Role.CANDIDATE,
            first_name="Alice",
            last_name="Dev",
        )
        self.cand_profile = CandidateProfile.objects.create(
            user=self.cand_user,
            university="RUPP",
            major="Computer Science",
            graduation_year=2024,
            bio="Passionate Python and Django backend developer.",
        )

        # Company user & profile
        self.comp_user = User.objects.create_user(
            username="company_ml_test",
            email="company_ml@test.com",
            password="testpassword123",
            role=User.Role.COMPANY,
        )
        self.comp_profile = CompanyProfile.objects.create(
            user=self.comp_user,
            company_name="Cloud Solutions Co.",
            location="Phnom Penh",
        )

        # Skills
        self.skill_python = Skill.objects.create(name="Python")
        self.skill_django = Skill.objects.create(name="Django")
        self.skill_react = Skill.objects.create(name="React")

        # Candidate skills
        CandidateSkill.objects.create(
            candidate=self.cand_profile,
            skill=self.skill_python,
            proficiency=CandidateSkill.Proficiency.EXPERT,
        )
        CandidateSkill.objects.create(
            candidate=self.cand_profile,
            skill=self.skill_django,
            proficiency=CandidateSkill.Proficiency.INTERMEDIATE,
        )

        # Job 1: Matching Backend Job
        self.job_backend = Job.objects.create(
            company=self.comp_profile,
            title="Python Django Backend Developer",
            description="Build scalable APIs using Python and Django REST Framework.",
            location="Phnom Penh",
            employment_type="FULL_TIME",
            workplace_type="ON_SITE",
            status=Job.Status.PUBLISHED,
            min_experience_years=1,
        )
        JobSkill.objects.create(job=self.job_backend, skill=self.skill_python, is_required=True)
        JobSkill.objects.create(job=self.job_backend, skill=self.skill_django, is_required=True)

        # Job 2: Mismatched Frontend Job
        self.job_frontend = Job.objects.create(
            company=self.comp_profile,
            title="Frontend React Specialist",
            description="Develop interactive web applications using React and CSS.",
            location="Siem Reap",
            employment_type="PART_TIME",
            workplace_type="REMOTE",
            status=Job.Status.PUBLISHED,
            min_experience_years=3,
        )
        JobSkill.objects.create(job=self.job_frontend, skill=self.skill_react, is_required=True)

    def test_evaluate_pair_and_contract(self):
        from apps.ml_engine.service import CoreMatchingService

        result = CoreMatchingService.evaluate_pair(self.cand_profile, self.job_backend)

        # Frontend contract requirements
        self.assertIn("id", result)
        self.assertIn("job", result)
        self.assertIn("match_score", result)
        self.assertIn("score_breakdown", result)
        self.assertIn("matching_skills", result)
        self.assertIn("missing_skills", result)
        self.assertIn("explanation", result)
        self.assertIn("improvement_suggestions", result)
        self.assertIn("fit_verdict", result)
        self.assertEqual(result["model_version"], "v1.0-lightgbm")

        self.assertGreaterEqual(result["match_score"], 60)
        self.assertIn("Python", result["matching_skills"])
        self.assertIn("Django", result["matching_skills"])
        self.assertEqual(len(result["missing_skills"]), 0)

    def test_ranking_and_ordering(self):
        from apps.ml_engine.service import CoreMatchingService
        from apps.jobs.models import Job

        ranked = CoreMatchingService.rank_jobs_for_candidate(
            self.cand_profile,
            Job.objects.filter(status=Job.Status.PUBLISHED),
        )

        self.assertEqual(len(ranked), 2)
        # Backend job must rank first due to skill and role alignment
        self.assertEqual(ranked[0]["id"], self.job_backend.id)
        self.assertGreater(ranked[0]["match_score"], ranked[1]["match_score"])

    def test_ranking_filters(self):
        from apps.ml_engine.service import CoreMatchingService
        from apps.jobs.models import Job

        # Location filter
        phnom_penh_jobs = CoreMatchingService.rank_jobs_for_candidate(
            self.cand_profile,
            Job.objects.filter(status=Job.Status.PUBLISHED),
            location="Phnom Penh",
        )
        self.assertEqual(len(phnom_penh_jobs), 1)
        self.assertEqual(phnom_penh_jobs[0]["id"], self.job_backend.id)

        # Search filter
        react_jobs = CoreMatchingService.rank_jobs_for_candidate(
            self.cand_profile,
            Job.objects.filter(status=Job.Status.PUBLISHED),
            search="React",
        )
        self.assertEqual(len(react_jobs), 1)
        self.assertEqual(react_jobs[0]["id"], self.job_frontend.id)


