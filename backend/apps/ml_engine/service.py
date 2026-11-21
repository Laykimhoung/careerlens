"""
Core Matching Service for CareerLens.
Orchestrates end-to-end ML inference, ranking, and explanation generation
with zero external API calls.
"""

import os
import logging
import threading
import joblib
from typing import Dict, List, Any, Optional

from apps.jobs.serializers import JobSerializer
from .features import extract_features_for_models
from .explainer import generate_explanation_payload
from .embedder import get_embedder

logger = logging.getLogger(__name__)

ARTIFACT_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "artifacts", "matching_model_v1.joblib")
)


class CoreMatchingService:
    """
    Singleton service managing the trained LightGBM ML model for candidate-job matching.
    """
    _model = None
    _lock = threading.Lock()
    _initialized = False

    @classmethod
    def initialize(cls):
        """Pre-loads the model weights and embedder into memory."""
        if cls._initialized:
            return
        with cls._lock:
            if cls._initialized:
                return
            try:
                if os.path.exists(ARTIFACT_PATH):
                    logger.info("Loading ML matching model from %s...", ARTIFACT_PATH)
                    cls._model = joblib.load(ARTIFACT_PATH)
                    logger.info("ML matching model loaded successfully.")
                else:
                    logger.warning("ML matching model artifact not found at %s. Fallback mode enabled.", ARTIFACT_PATH)
                # Initialize embedder singleton
                get_embedder()
            except Exception as e:
                logger.error("Error initializing CoreMatchingService: %s", e)
            finally:
                cls._initialized = True

    @classmethod
    def get_model(cls):
        if not cls._initialized:
            cls.initialize()
        return cls._model

    @classmethod
    def evaluate_pair(
        cls,
        candidate,
        job,
        preferences: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Evaluates a single CandidateProfile against a Job instance using the trained ML model.
        Returns a complete recommendation dictionary adhering to the BestFitJobs.jsx frontend contract.
        """
        prefs = preferences or {}
        model = cls.get_model()

        # 1. Feature Extraction (15 continuous normalized features)
        feat_vec, feat_dict = extract_features_for_models(candidate, job, prefs)

        # 2. Supervised ML Model Inference
        if model is not None:
            try:
                raw_pred = float(model.predict(feat_vec.reshape(1, -1))[0])
            except Exception as e:
                logger.warning("Model inference exception, applying fallback: %s", e)
                raw_pred = float(
                    (0.40 * feat_dict["skill_jaccard_ratio"]) +
                    (0.25 * feat_dict["sim_experience"]) +
                    (0.15 * feat_dict["education_alignment"]) +
                    (0.10 * feat_dict["location_compatibility"]) +
                    (0.10 * feat_dict["employment_type_match"])
                ) * 3.0
        else:
            # Deterministic fallback when artifact is missing
            raw_pred = float(
                (0.40 * feat_dict["skill_jaccard_ratio"]) +
                (0.25 * feat_dict["sim_experience"]) +
                (0.15 * feat_dict["education_alignment"]) +
                (0.10 * feat_dict["location_compatibility"]) +
                (0.10 * feat_dict["employment_type_match"])
            ) * 3.0

        # 3. Calibration to 0 - 100 Integer Match Score
        # Target scale: [0.0, 3.0] -> [0, 100]
        calibrated_score = int(round(min(100.0, max(0.0, (raw_pred / 3.0) * 100.0))))

        # 4. Prepare Context for Explainer
        cand_skills = []
        if candidate:
            for cs in candidate.skills.select_related("skill").all():
                if cs.skill:
                    cand_skills.append({
                        "name": cs.skill.name,
                        "proficiency": cs.proficiency,
                    })

        job_skills = []
        for js in job.job_skills.select_related("skill").all():
            if js.skill:
                job_skills.append({
                    "name": js.skill.name,
                    "is_required": getattr(js, "is_required", True),
                })

        company_name = job.company.company_name if job.company else "the hiring team"
        cand_major = candidate.major if candidate else ""
        has_resume = bool(candidate and candidate.resume_file)
        target_role = prefs.get("target_role", "")

        # 5. Generate UI Meters, Explanations, and Suggestions
        explanation_payload = generate_explanation_payload(
            candidate_skills=cand_skills,
            job_skills=job_skills,
            job_title=job.title,
            company_name=company_name,
            candidate_major=cand_major,
            calibrated_score=calibrated_score,
            feature_dict=feat_dict,
            has_resume=has_resume,
            target_role=target_role,
        )

        job_data = JobSerializer(job).data

        result = {
            "id": job.id,
            "job": job_data,
            "match_score": explanation_payload["match_score"],
            "score_breakdown": explanation_payload["score_breakdown"],
            "matching_skills": explanation_payload["matching_skills"],
            "missing_skills": explanation_payload["missing_skills"],
            "explanation": explanation_payload["explanation"],
            "improvement_suggestions": explanation_payload["improvement_suggestions"],
            "fit_verdict": explanation_payload["fit_verdict"],
            "model_version": "v1.0-lightgbm",
        }
        return result

    @classmethod
    def rank_jobs_for_candidate(
        cls,
        candidate,
        jobs_queryset,
        preferences: Optional[Dict[str, Any]] = None,
        search: Optional[str] = None,
        min_score: Optional[Any] = None,
        location: Optional[str] = None,
        employment_type: Optional[str] = None,
        workplace_type: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Evaluates a collection of published jobs against a candidate's profile and preferences.
        Applies filtering, scores pairs with ML, and sorts by match_score descending.
        """
        qs = jobs_queryset.select_related("company__user").prefetch_related("job_skills__skill")

        if location and location.strip():
            qs = qs.filter(location__icontains=location.strip())
        if employment_type and employment_type.strip():
            qs = qs.filter(employment_type=employment_type.strip().upper())
        if workplace_type and workplace_type.strip():
            qs = qs.filter(workplace_type=workplace_type.strip().upper())

        results = []
        for job in list(qs):
            rec = cls.evaluate_pair(candidate, job, preferences=preferences)

            # Search query filtering
            if search and search.strip():
                q = search.strip().lower()
                job_title = job.title.lower()
                comp_name = (job.company.company_name if job.company else "").lower()
                job_loc = (job.location or "").lower()
                skills_str = " ".join(s.lower() for s in rec["matching_skills"])
                if q not in job_title and q not in comp_name and q not in job_loc and q not in skills_str:
                    continue

            # Minimum score threshold filtering
            if min_score is not None:
                try:
                    min_s = int(min_score)
                    if rec["match_score"] < min_s:
                        continue
                except (ValueError, TypeError):
                    pass

            results.append(rec)

        # Sort descending by match score
        results.sort(key=lambda x: x["match_score"], reverse=True)
        return results
