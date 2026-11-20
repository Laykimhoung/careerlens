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

