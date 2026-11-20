from django.apps import AppConfig


class MlEngineConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.ml_engine"
    verbose_name = "ML Engine"

    def ready(self):
        """Initializes ML model artifacts once at Django process startup."""
        import sys
        # Avoid running heavy model initialization during migrations, collectstatic, or management commands that don't need it
        skip_commands = ["makemigrations", "migrate", "collectstatic", "check"]
        if any(cmd in sys.argv for cmd in skip_commands):
            return

        try:
            from .service import CoreMatchingService
            CoreMatchingService.initialize()
        except Exception:
            pass

