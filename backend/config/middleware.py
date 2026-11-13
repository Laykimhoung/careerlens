"""
Edge-level HTTP security, payload-size, flood/rate-limiting, and response header middleware.
"""

import time
from django.conf import settings
from django.core.cache import caches
from django.http import JsonResponse

from .throttles import get_client_ip


class ProductionSecurityMiddleware:
    """
    Provides defense-in-depth HTTP protections across both DRF and non-DRF views:
    - Early Content-Length upper bound rejection (HTTP 413) to prevent memory exhaustion
    - IP-scoped flood / brute-force guard for global traffic, admin login, and webhooks
    - Security headers (Permissions-Policy and non-cacheable auth responses)
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        size_error = self._check_content_length(request)
        if size_error is not None:
            return size_error

        throttle_error = self._check_rate_limits(request)
        if throttle_error is not None:
            return throttle_error

        response = self.get_response(request)
        self._apply_security_headers(request, response)
        return response

    def _check_content_length(self, request):
        raw_length = request.META.get("CONTENT_LENGTH")
        if not raw_length:
            return None

        try:
            content_length = int(raw_length)
        except (TypeError, ValueError):
            return JsonResponse({"detail": "Invalid Content-Length header."}, status=400)

        if content_length < 0:
            return JsonResponse({"detail": "Invalid Content-Length header."}, status=400)

        max_bytes = int(getattr(settings, "MAX_REQUEST_BODY_BYTES", 10 * 1024 * 1024))
        if content_length > max_bytes:
            return JsonResponse(
                {"detail": "Request payload exceeds the maximum allowed size."},
                status=413,
            )
        return None

    def _check_rate_limits(self, request):
        if not getattr(settings, "RATE_LIMIT_MIDDLEWARE_ENABLED", True):
            return None

        client_ip = get_client_ip(request)
        path = request.path or "/"
        method = (request.method or "GET").upper()

        # Always check global per-IP flood limit first
        global_limit = int(getattr(settings, "GLOBAL_IP_BURST_LIMIT", 300))
        if global_limit > 0:
            limited, retry_after = self._consume_quota(
                scope="global",
                ident=client_ip,
                limit=global_limit,
                window_seconds=60,
            )
            if limited:
                return self._too_many_requests(retry_after)

        # Protect Django Admin login against credential stuffing
        if path.startswith("/admin/login") and method == "POST":
            admin_limit = int(getattr(settings, "ADMIN_LOGIN_RATE_LIMIT", 10))
            if admin_limit > 0:
                limited, retry_after = self._consume_quota(
                    scope="admin_login",
                    ident=client_ip,
                    limit=admin_limit,
                    window_seconds=60,
                )
                if limited:
                    return self._too_many_requests(retry_after)

        # Protect Telegram webhook from floods (non-DRF Django View)
        if path.startswith("/api/telegram/webhook"):
            webhook_limit = int(getattr(settings, "WEBHOOK_RATE_LIMIT", 120))
            if webhook_limit > 0:
                limited, retry_after = self._consume_quota(
                    scope="telegram_webhook",
                    ident=client_ip,
                    limit=webhook_limit,
                    window_seconds=60,
                )
                if limited:
                    return self._too_many_requests(retry_after)

        return None

    def _consume_quota(self, scope, ident, limit, window_seconds):
        cache_alias = getattr(settings, "RATE_LIMIT_CACHE", "default")
        cache = caches[cache_alias]
        now = int(time.time())
        bucket = now // window_seconds
        reset_at = (bucket + 1) * window_seconds
        retry_after = max(1, reset_at - now)
        key = f"rl:{scope}:{ident}:{bucket}"

        if cache.add(key, 1, timeout=window_seconds + 5):
            return False, retry_after

        try:
            count = cache.incr(key)
        except ValueError:
            cache.set(key, 1, timeout=window_seconds + 5)
            return False, retry_after

        return count > limit, retry_after

    @staticmethod
    def _too_many_requests(retry_after):
        response = JsonResponse(
            {"detail": "Too many requests. Please slow down and try again shortly."},
            status=429,
        )
        response["Retry-After"] = str(retry_after)
        return response

    @staticmethod
    def _apply_security_headers(request, response):
        response.setdefault(
            "Permissions-Policy",
            "camera=(self), microphone=(self), geolocation=(), payment=(), usb=()",
        )
        if (request.path or "").startswith("/api/auth/"):
            response.setdefault("Cache-Control", "no-store, no-cache, must-revalidate, private")
            response.setdefault("Pragma", "no-cache")

