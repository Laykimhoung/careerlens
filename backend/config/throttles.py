"""
Proxy-safe client IP resolution and DRF rate-limiting throttle classes.
"""

from django.conf import settings
from rest_framework.settings import api_settings
from rest_framework.throttling import AnonRateThrottle, ScopedRateThrottle, UserRateThrottle


def get_client_ip(request, num_proxies=None):
    """
    Extract the real client IP without trusting spoofable leftmost X-Forwarded-For values.

    Behind N trusted reverse proxies (e.g., Render sets N=1), the rightmost Nth
    entry in X-Forwarded-For is appended by the trusted edge proxy, so we select
    `hops[-num_proxies]` rather than `hops[0]`.
    """
    if num_proxies is None:
        num_proxies = int(getattr(settings, "DRF_NUM_PROXIES", 1))

    meta = getattr(request, "META", {}) or {}
    xff = meta.get("HTTP_X_FORWARDED_FOR", "")
    if xff and num_proxies > 0:
        hops = [hop.strip() for hop in xff.split(",") if hop.strip()]
        if hops:
            index = max(0, len(hops) - num_proxies)
            return hops[index]

    return meta.get("REMOTE_ADDR", "unknown")


class ClientIPRateThrottleMixin:
    """Resolve throttle cache keys using trusted rightmost proxy hops and live DRF settings."""

    def get_ident(self, request):
        return get_client_ip(request)

    def get_rate(self):
        if getattr(self, "scope", None):
            rates = api_settings.DEFAULT_THROTTLE_RATES or {}
            if self.scope in rates:
                return rates[self.scope]
        return super().get_rate()


class ProxySafeAnonRateThrottle(ClientIPRateThrottleMixin, AnonRateThrottle):
    pass


class ProxySafeUserRateThrottle(ClientIPRateThrottleMixin, UserRateThrottle):
    pass


class ProxySafeScopedRateThrottle(ClientIPRateThrottleMixin, ScopedRateThrottle):
    pass

