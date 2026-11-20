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
