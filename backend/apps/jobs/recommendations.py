"""
Candidate Job Matching & Recommendation Module.
Powered by CareerLens ML Engine (supervised LightGBM model and SentenceTransformer embeddings).
Maintains 100% contract compatibility with the frontend BestFitJobs.jsx interface.
"""

from typing import Dict, List, Any, Optional
from apps.jobs.models import Job
from apps.ml_engine.service import CoreMatchingService


def calculate_job_recommendation(
    candidate,
    job,
    preferences: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Computes an explainable ML match score and breakdown between a candidate and a Job
    using CareerLens in-house trained LightGBM ML model and local SentenceTransformer embeddings.
    Adheres strictly to the BestFitJobs.jsx frontend contract.
    """
    return CoreMatchingService.evaluate_pair(candidate, job, preferences=preferences)


def get_candidate_recommendations(
    candidate,
    preferences: Optional[Dict[str, Any]] = None,
    search: Optional[str] = None,
    min_score: Optional[Any] = None,
    location: Optional[str] = None,
    employment_type: Optional[str] = None,
    workplace_type: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Evaluates published jobs against a candidate's profile and preferences using the
    supervised ML matching engine.
    Returns a sorted list of recommendation objects.
    """
    qs = Job.objects.filter(status=Job.Status.PUBLISHED)
    return CoreMatchingService.rank_jobs_for_candidate(
        candidate=candidate,
        jobs_queryset=qs,
        preferences=preferences,
        search=search,
        min_score=min_score,
        location=location,
        employment_type=employment_type,
        workplace_type=workplace_type,
    )
