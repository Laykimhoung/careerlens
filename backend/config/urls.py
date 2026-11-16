"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
import logging
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.db import connection
from django.http import HttpResponse, JsonResponse
from django.views.decorators.http import require_safe

logger = logging.getLogger(__name__)


def api_root_view(request):
    if not settings.DEBUG:
        return JsonResponse({
            "project": "CareerLens REST API",
            "status": "online",
            "demo_mode": getattr(settings, "ENABLE_DEMO_MODE", False),
        })
    return JsonResponse({
        "project": "CareerLens REST API",
        "status": "online",
        "demo_mode": getattr(settings, "ENABLE_DEMO_MODE", False),
        "message": "Welcome to CareerLens API. The React frontend is running at http://localhost:5173/",
        "endpoints": {
            "admin": "/admin/",
            "auth": "/api/auth/",
            "jobs": "/api/jobs/",
            "categories": "/api/categories/",
            "skills": "/api/skills/",
            "saved_jobs": "/api/saved-jobs/",
            "recommendations": "/api/recommendations/",
            "roadmap": "/api/roadmap/",
            "resumes": "/api/resumes/",
            "applications": "/api/applications/",
            "messages": "/api/messages/",
            "notifications": "/api/notifications/",
            "telegram": "/api/telegram/webhook/",
        }
    })


@require_safe
def health_check_view(request):
    """Lightweight unauthenticated health endpoint verifying backend & PostgreSQL readiness."""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        status_code = 200
        payload = {
            "status": "ok",
            "service": "CareerLens API",
            "database": "connected",
        }
    except Exception as exc:
        logger.warning("Health check database probe failed (%s).", type(exc).__name__)
        status_code = 503
        payload = {
            "status": "unhealthy",
            "service": "CareerLens API",
            "database": "unavailable",
        }

    if request.method == "HEAD":
        response = HttpResponse(status=status_code, content_type="application/json")
    else:
        response = JsonResponse(payload, status=status_code)
    response["Cache-Control"] = "no-store"
    return response


admin.site.site_header = "CareerLens Admin"
admin.site.site_title = "CareerLens Admin"
admin.site.index_title = "Platform Administration"

urlpatterns = [
    path('', api_root_view, name='api-root'),
    path('api/health/', health_check_view, name='api-health'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/', include('apps.jobs.urls')),
    path('api/', include('apps.applications.urls')),
    path('api/', include('apps.messaging.urls')),
    path('api/telegram/', include('apps.telegram_bot.urls')),
    path('api/resumes/', include('apps.resumes.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
