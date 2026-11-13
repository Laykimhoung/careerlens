"""
Bounded DRF pagination to prevent large page_size queries from exhausting memory or DB resources.
"""

from rest_framework.pagination import PageNumberPagination


class BoundedPageNumberPagination(PageNumberPagination):
    page_size = 100
    page_size_query_param = "page_size"
    max_page_size = 100

