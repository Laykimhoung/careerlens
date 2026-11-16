import json
from unittest.mock import MagicMock, patch

from django.db import OperationalError
from django.test import TestCase, override_settings
from django.urls import reverse


class HealthCheckTests(TestCase):
    def test_health_check_healthy_returns_200_and_expected_payload(self):
        url = reverse("api-health")
        self.assertEqual(url, "/api/health/")

        with override_settings(DEBUG=False):
            response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            json.loads(response.content.decode("utf-8")),
            {
                "status": "ok",
                "service": "CareerLens API",
                "database": "connected",
            },
        )
        self.assertEqual(response["Cache-Control"], "no-store")

    def test_health_check_db_failure_returns_503_without_leaking_details(self):
        mock_cursor = MagicMock()
        mock_cursor.__enter__.return_value.execute.side_effect = OperationalError(
            "postgresql://secret_user:secret_pass@neon.tech/db connection refused"
        )

        with patch("config.urls.connection.cursor", return_value=mock_cursor):
            with self.assertLogs("config.urls", level="WARNING") as captured:
                response = self.client.get(reverse("api-health"))

        self.assertEqual(response.status_code, 503)
        raw_body = response.content.decode("utf-8")
        self.assertEqual(
            json.loads(raw_body),
            {
                "status": "unhealthy",
                "service": "CareerLens API",
                "database": "unavailable",
            },
        )
        self.assertNotIn("secret_pass", raw_body)
        self.assertNotIn("neon.tech", raw_body)
        self.assertNotIn("secret_pass", "\n".join(captured.output))
        self.assertEqual(response["Cache-Control"], "no-store")

    def test_health_check_rejects_non_get_methods(self):
        url = reverse("api-health")
        for method_fn in (self.client.post, self.client.put, self.client.patch, self.client.delete):
            resp = method_fn(url)
            self.assertEqual(resp.status_code, 405)

    def test_existing_root_and_telegram_health_routes_remain_unchanged(self):
        root_resp = self.client.get("/")
        self.assertEqual(root_resp.status_code, 200)
        self.assertEqual(json.loads(root_resp.content.decode("utf-8"))["status"], "online")

        tg_resp = self.client.get(reverse("telegram_webhook"))
        self.assertEqual(tg_resp.status_code, 200)
        self.assertEqual(
            json.loads(tg_resp.content.decode("utf-8"))["service"],
            "CareerLens Telegram Bot Webhook",
        )
