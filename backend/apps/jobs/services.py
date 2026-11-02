from django.db.models import Q
from django.utils import timezone
from .models import Job


def filter_jobs(queryset, search=None, location=None, exclude_expired=True):
    """
    Applies shared search and location filters to a Job queryset.
    - search: matches title, company name, skill tag, or description.
    - location: case-insensitive partial match on job location.
    - exclude_expired: if True, filters out jobs whose deadline is in the past.
    """
    qs = queryset

    if exclude_expired:
        now = timezone.now()
        qs = qs.filter(Q(deadline__isnull=True) | Q(deadline__gte=now))

    if search:
        search_term = search.strip()
        if search_term:
            qs = qs.filter(
                Q(title__icontains=search_term)
                | Q(description__icontains=search_term)
                | Q(company__company_name__icontains=search_term)
                | Q(job_skills__skill__name__icontains=search_term)
            ).distinct()

    if location:
        loc_term = location.strip()
        if loc_term:
            qs = qs.filter(location__icontains=loc_term)

    return qs


def get_public_jobs(search=None, location=None, limit=None):
    """
    Returns an optimized queryset of publicly available jobs:
    - Only PUBLISHED status.
    - Non-expired deadline (or deadline not set).
    - Pre-fetched company and skill relations.
    - Ordered by newest first.
    """
    qs = (
        Job.objects.select_related("company__user")
        .prefetch_related("job_skills__skill")
        .filter(status=Job.Status.PUBLISHED)
        .order_by("-created_at")
    )

    qs = filter_jobs(qs, search=search, location=location, exclude_expired=True)

    if limit is not None and limit > 0:
        return qs[:limit]
    return qs


def get_public_job_by_id(job_id):
    """
    Retrieves a single publicly visible job by ID.
    Returns None if the job does not exist, is in DRAFT/CLOSED status, or is expired.
    """
    try:
        now = timezone.now()
        return (
            Job.objects.select_related("company__user")
            .prefetch_related("job_skills__skill")
            .filter(status=Job.Status.PUBLISHED)
            .filter(Q(deadline__isnull=True) | Q(deadline__gte=now))
            .get(id=job_id)
        )
    except (Job.DoesNotExist, ValueError):
        return None

