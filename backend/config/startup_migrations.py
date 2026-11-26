import logging
import os
import sys

logger = logging.getLogger(__name__)

# Fixed PostgreSQL advisory lock key so multi-worker WSGI boots serialize migrations safely.
_MIGRATION_LOCK_KEY = 842910451
_SKIP_CLI_COMMANDS = frozenset({
    "migrate",
    "makemigrations",
    "showmigrations",
    "sqlmigrate",
    "test",
    "check",
    "collectstatic",
    "shell",
    "dbshell",
})


def _should_skip_auto_migrate() -> bool:
    if os.getenv("AUTO_MIGRATE_ON_BOOT", "True").strip().lower() not in ("true", "1", "yes"):
        return True
    if any(arg in _SKIP_CLI_COMMANDS for arg in sys.argv[1:3]):
        return True
    return False


def ensure_migrations_applied(using: str = "default") -> bool:
    """Apply pending Django migrations once at WSGI startup if Neon/Postgres is behind."""
    if _should_skip_auto_migrate():
        return False

    from django.core.management import call_command
    from django.db import connections
    from django.db.migrations.executor import MigrationExecutor

    conn = connections[using]
    try:
        executor = MigrationExecutor(conn)
        targets = executor.loader.graph.leaf_nodes()
        if not executor.migration_plan(targets):
            return False

        if conn.vendor == "postgresql":
            with conn.cursor() as cursor:
                cursor.execute("SELECT pg_advisory_lock(%s)", [_MIGRATION_LOCK_KEY])
            try:
                executor = MigrationExecutor(conn)
                if executor.migration_plan(executor.loader.graph.leaf_nodes()):
                    logger.info("Applying pending database migrations on startup...")
                    call_command("migrate", database=using, interactive=False, verbosity=1)
                    return True
            finally:
                if getattr(conn, "connection", None) is not None:
                    try:
                        with conn.cursor() as cursor:
                            cursor.execute("SELECT pg_advisory_unlock(%s)", [_MIGRATION_LOCK_KEY])
                    except Exception:
                        logger.warning("Failed to release PostgreSQL migration advisory lock.", exc_info=True)
        else:
            logger.info("Applying pending database migrations on startup...")
            call_command("migrate", database=using, interactive=False, verbosity=1)
            return True
    except Exception:
        logger.exception("Automatic startup migration failed.")
    return False
