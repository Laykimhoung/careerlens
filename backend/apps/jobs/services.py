import math
import re
from django.db.models import Q
from django.utils import timezone
from .models import Job


def filter_jobs(
    queryset,
    search=None,
    location=None,
    exclude_expired=True,
    workplace_type=None,
    employment_type=None,
):
    """
    Applies shared search, location, workplace_type, and employment_type filters to a Job queryset.
    - search: matches title, company name, industry, skill tag, location, or description.
    - location: case-insensitive partial match on job location.
    - exclude_expired: if True, filters out jobs whose deadline is in the past.
    - workplace_type: optional WorkplaceType value or list/tuple of values (e.g. 'REMOTE').
    - employment_type: optional EmploymentType value or list/tuple of values (e.g. 'INTERNSHIP').
    """
    qs = queryset

    if exclude_expired:
        now = timezone.now()
        qs = qs.filter(Q(deadline__isnull=True) | Q(deadline__gte=now))

    if workplace_type:
        if isinstance(workplace_type, (list, tuple, set)):
            qs = qs.filter(workplace_type__in=workplace_type)
        else:
            qs = qs.filter(workplace_type=workplace_type)

    if employment_type:
        if isinstance(employment_type, (list, tuple, set)):
            qs = qs.filter(employment_type__in=employment_type)
        else:
            qs = qs.filter(employment_type=employment_type)

    if search:
        search_term = search.strip()
        if search_term:
            normalized_enum = re.sub(r"[\s-]+", "_", search_term).upper()
            search_q = (
                Q(title__icontains=search_term)
                | Q(description__icontains=search_term)
                | Q(company__company_name__icontains=search_term)
                | Q(company__industry__icontains=search_term)
                | Q(location__icontains=search_term)
                | Q(job_skills__skill__name__icontains=search_term)
                | Q(workplace_type__icontains=normalized_enum)
                | Q(employment_type__icontains=normalized_enum)
            )
            qs = qs.filter(search_q).distinct()

    if location:
        loc_term = location.strip()
        if loc_term:
            qs = qs.filter(location__icontains=loc_term)

    return qs


def get_public_jobs(
    search=None,
    location=None,
    limit=None,
    workplace_type=None,
    employment_type=None,
):
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

    qs = filter_jobs(
        qs,
        search=search,
        location=location,
        exclude_expired=True,
        workplace_type=workplace_type,
        employment_type=employment_type,
    )

    if limit is not None and limit > 0:
        return qs[:limit]
    return qs


def get_public_jobs_page(
    search=None,
    location=None,
    workplace_type=None,
    employment_type=None,
    page=0,
    per_page=5,
):
    """
    Returns a paginated slice of public jobs along with pagination metadata:
    (items_list, total_count, total_pages, clamped_page)
    """
    per_page = max(1, int(per_page))
    qs = get_public_jobs(
        search=search,
        location=location,
        workplace_type=workplace_type,
        employment_type=employment_type,
    )
    total_count = qs.count()
    if total_count == 0:
        return [], 0, 1, 0

    total_pages = max(1, math.ceil(total_count / per_page))
    safe_page = max(0, min(int(page), total_pages - 1))
    start = safe_page * per_page
    items = list(qs[start : start + per_page])
    return items, total_count, total_pages, safe_page


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
