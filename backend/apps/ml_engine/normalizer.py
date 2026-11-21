"""
Skill normalization and text sanitization module for CareerLens ML Engine.
Provides canonical mapping for technical skills, frameworks, databases, and tools.
"""

import re
import html
from typing import List, Set, Dict, Optional


# Canonical skill alias dictionary: alias (lowercase, stripped) -> canonical name
CANONICAL_SKILL_MAP: Dict[str, str] = {
    # Programming Languages
    "js": "JavaScript",
    "javascript": "JavaScript",
    "es6": "JavaScript",
    "ts": "TypeScript",
    "typescript": "TypeScript",
    "py": "Python",
    "python": "Python",
    "python3": "Python",
    "golang": "Go",
    "go": "Go",
    "c++": "C++",
    "cpp": "C++",
    "c#": "C#",
    "csharp": "C#",
    ".net": ".NET",
    "dotnet": ".NET",
    "java": "Java",
    "kotlin": "Kotlin",
    "php": "PHP",
    "ruby": "Ruby",
    "rust": "Rust",
    "swift": "Swift",
    "dart": "Dart",
    "r": "R",

    # Frontend Frameworks & Libraries
    "react": "React",
    "reactjs": "React",
    "react.js": "React",
    "vue": "Vue.js",
    "vuejs": "Vue.js",
    "vue.js": "Vue.js",
    "angular": "Angular",
    "angularjs": "Angular",
    "next": "Next.js",
    "nextjs": "Next.js",
    "next.js": "Next.js",
    "nuxt": "Nuxt.js",
    "nuxtjs": "Nuxt.js",
    "svelte": "Svelte",
    "sveltekit": "SvelteKit",
    "html": "HTML5",
    "html5": "HTML5",
    "css": "CSS3",
    "css3": "CSS3",
    "sass": "Sass",
    "scss": "Sass",
    "tailwind": "Tailwind CSS",
    "tailwindcss": "Tailwind CSS",
    "tailwind css": "Tailwind CSS",
    "bootstrap": "Bootstrap",
    "redux": "Redux",
    "zustand": "Zustand",
    "mobx": "MobX",

    # Backend Frameworks
    "django": "Django",
    "drf": "Django REST Framework",
    "django rest": "Django REST Framework",
    "django rest framework": "Django REST Framework",
    "django-rest-framework": "Django REST Framework",
    "fastapi": "FastAPI",
    "flask": "Flask",
    "node": "Node.js",
    "nodejs": "Node.js",
    "node.js": "Node.js",
    "express": "Express.js",
    "expressjs": "Express.js",
    "express.js": "Express.js",
    "nestjs": "NestJS",
    "spring": "Spring Boot",
    "springboot": "Spring Boot",
    "spring boot": "Spring Boot",
    "laravel": "Laravel",
    "rails": "Ruby on Rails",
    "ruby on rails": "Ruby on Rails",
    "asp.net": "ASP.NET",

    # Databases & Storage
    "sql": "SQL",
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "psql": "PostgreSQL",
    "mysql": "MySQL",
    "sqlite": "SQLite",
    "mongodb": "MongoDB",
    "mongo": "MongoDB",
    "redis": "Redis",
    "cassandra": "Cassandra",
    "dynamodb": "DynamoDB",
    "firebase": "Firebase",
    "firestore": "Firestore",
    "supabase": "Supabase",

    # Cloud, DevOps & Infrastructure
    "docker": "Docker",
    "k8s": "Kubernetes",
    "kubernetes": "Kubernetes",
    "aws": "AWS",
    "amazon web services": "AWS",
    "gcp": "GCP",
    "google cloud": "GCP",
    "google cloud platform": "GCP",
    "azure": "Azure",
    "ci/cd": "CI/CD",
    "cicd": "CI/CD",
    "github actions": "GitHub Actions",
    "gitlab ci": "GitLab CI",
    "jenkins": "Jenkins",
    "terraform": "Terraform",
    "ansible": "Ansible",
    "linux": "Linux",
    "nginx": "Nginx",

    # Data Science, AI & Machine Learning
    "ml": "Machine Learning",
    "machine learning": "Machine Learning",
    "ai": "Artificial Intelligence",
    "artificial intelligence": "Artificial Intelligence",
    "deep learning": "Deep Learning",
    "nlp": "Natural Language Processing",
    "computer vision": "Computer Vision",
    "pandas": "Pandas",
    "numpy": "NumPy",
    "scipy": "SciPy",
    "scikit-learn": "scikit-learn",
    "sklearn": "scikit-learn",
    "pytorch": "PyTorch",
    "torch": "PyTorch",
    "tensorflow": "TensorFlow",
    "tf": "TensorFlow",
    "keras": "Keras",
    "lightgbm": "LightGBM",
    "xgboost": "XGBoost",

    # Testing & Tooling
    "git": "Git",
    "github": "GitHub",
    "gitlab": "GitLab",
    "jest": "Jest",
    "pytest": "pytest",
    "playwright": "Playwright",
    "cypress": "Cypress",
    "selenium": "Selenium",
    "postman": "Postman",
    "figma": "Figma",
    "rest api": "REST APIs",
    "restful": "REST APIs",
    "rest": "REST APIs",
    "graphql": "GraphQL",
    "grpc": "gRPC",
}


def normalize_skill_name(raw_name: str) -> str:
    """
    Normalizes a skill string to its canonical representation.
    E.g. 'js' -> 'JavaScript', 'React.js' -> 'React', 'DRF' -> 'Django REST Framework'.
    If no alias is found, returns the clean title-cased or trimmed string.
    """
    if not raw_name or not isinstance(raw_name, str):
        return ""
    cleaned = raw_name.strip()
    key = cleaned.lower()
    if key in CANONICAL_SKILL_MAP:
        return CANONICAL_SKILL_MAP[key]
    # Remove redundant trailing dots or spaces
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def normalize_skill_set(skills: List[str]) -> List[str]:
    """
    Normalizes a list of skill strings and eliminates duplicates while preserving order.
    """
    seen: Set[str] = set()
    result: List[str] = []
    for s in skills:
        norm = normalize_skill_name(s)
        if norm and norm.lower() not in seen:
            seen.add(norm.lower())
            result.append(norm)
    return result


def clean_text(raw_text: Optional[str]) -> str:
    """
    Strips HTML tags, decodes HTML entities, and normalizes whitespaces and punctuation.
    """
    if not raw_text or not isinstance(raw_text, str):
        return ""
    # Strip HTML tags
    text = re.sub(r"<[^>]+>", " ", raw_text)
    # Decode HTML entities (e.g. &amp;, &nbsp;)
    text = html.unescape(text)
    # Fix whitespace before punctuation
    text = re.sub(r"\s+([.,;:!?])", r"\1", text)
    # Normalize whitespaces
    text = re.sub(r"\s+", " ", text).strip()
    return text


def extract_skills_from_text(text: str, known_skills: Optional[List[str]] = None) -> List[str]:
    """
    Extracts recognized technical skills from free-form text using exact word boundary matching.
    """
    if not text:
        return []
    clean = clean_text(text).lower()
    matched_skills: Set[str] = set()

    # Match canonical keys
    for alias, canonical in CANONICAL_SKILL_MAP.items():
        pattern = r"\b" + re.escape(alias) + r"\b"
        if re.search(pattern, clean):
            matched_skills.add(canonical)

    # Match additional known skills if provided
    if known_skills:
        for ks in known_skills:
            if not ks:
                continue
            norm_ks = normalize_skill_name(ks)
            pattern = r"\b" + re.escape(norm_ks.lower()) + r"\b"
            if re.search(pattern, clean):
                matched_skills.add(norm_ks)

    return sorted(list(matched_skills))
