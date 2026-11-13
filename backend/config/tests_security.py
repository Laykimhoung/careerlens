import json
from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import CandidateProfile, CompanyProfile
from apps.applications.models import Application, Offer
from apps.jobs.models import Job
from apps.messaging.models import Message, Notification
from config.throttles import get_client_ip

User = get_user_model()


class SecurityHardeningTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.candidate_user = User.objects.create_user(
            username="sec_cand",
            email="sec_cand@example.com",
            password="StrongPassword123!",
            role=User.Role.CANDIDATE,
        )
        self.candidate_profile = CandidateProfile.objects.create(user=self.candidate_user)

        self.company_user = User.objects.create_user(
            username="sec_comp",
            email="sec_comp@example.com",
            password="StrongPassword123!",
            role=User.Role.COMPANY,
        )
        self.company_profile = CompanyProfile.objects.create(
            user=self.company_user,
            company_name="Secure Corp",
        )

    def tearDown(self):
        cache.clear()

    def test_register_rejects_admin_role_escalation(self):
        url = reverse("register")
        response = self.client.post(
            url,
            {
                "username": "evil_admin",
                "email": "evil_admin@example.com",
                "password": "StrongPassword123!",
                "role": User.Role.ADMIN,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(User.objects.filter(username="evil_admin").exists())

    @override_settings(DRF_NUM_PROXIES=1)
    def test_get_client_ip_ignores_spoofed_leftmost_xff(self):
        class DummyReq:
            META = {
                "HTTP_X_FORWARDED_FOR": "1.2.3.4, 5.6.7.8, 203.0.113.42",
                "REMOTE_ADDR": "10.0.0.1",
            }

        self.assertEqual(get_client_ip(DummyReq()), "203.0.113.42")

    @override_settings(
        REST_FRAMEWORK={
            "DEFAULT_AUTHENTICATION_CLASSES": (
                "rest_framework_simplejwt.authentication.JWTAuthentication",
            ),
            "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
            "DEFAULT_PAGINATION_CLASS": "config.pagination.BoundedPageNumberPagination",
            "PAGE_SIZE": 100,
            "DEFAULT_THROTTLE_CLASSES": [
                "config.throttles.ProxySafeAnonRateThrottle",
                "config.throttles.ProxySafeUserRateThrottle",
                "config.throttles.ProxySafeScopedRateThrottle",
            ],
            "DEFAULT_THROTTLE_RATES": {
                "anon": "60/min",
                "user": "180/min",
                "auth_login": "2/min",
                "auth_register": "10/min",
                "auth_password_reset": "2/min",
                "ai_generation": "2/min",
                "resume_upload": "10/min",
                "messaging": "60/min",
            },
            "NUM_PROXIES": 1,
        }
    )
    def test_login_rate_limit_blocks_xff_spoof_bypass(self):
        url = reverse("token_obtain_pair")
        payload = {"username": "sec_cand", "password": "WrongPassword!"}
        r1 = self.client.post(
            url, payload, format="json", HTTP_X_FORWARDED_FOR="1.1.1.1, 198.51.100.7"
        )
        r2 = self.client.post(
            url, payload, format="json", HTTP_X_FORWARDED_FOR="2.2.2.2, 198.51.100.7"
        )
        r3 = self.client.post(
            url, payload, format="json", HTTP_X_FORWARDED_FOR="3.3.3.3, 198.51.100.7"
        )
        self.assertEqual(r1.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(r2.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(r3.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    @override_settings(
        REST_FRAMEWORK={
            "DEFAULT_AUTHENTICATION_CLASSES": (
                "rest_framework_simplejwt.authentication.JWTAuthentication",
            ),
            "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
            "DEFAULT_PAGINATION_CLASS": "config.pagination.BoundedPageNumberPagination",
            "PAGE_SIZE": 100,
            "DEFAULT_THROTTLE_CLASSES": [
                "config.throttles.ProxySafeAnonRateThrottle",
                "config.throttles.ProxySafeUserRateThrottle",
                "config.throttles.ProxySafeScopedRateThrottle",
            ],
            "DEFAULT_THROTTLE_RATES": {
                "anon": "60/min",
                "user": "180/min",
                "auth_login": "10/min",
                "auth_register": "10/min",
                "auth_password_reset": "1/min",
                "ai_generation": "1/min",
                "resume_upload": "10/min",
                "messaging": "60/min",
            },
            "NUM_PROXIES": 1,
        }
    )
    def test_password_reset_and_ai_generation_rate_limits(self):
        forgot_url = reverse("forgot_password")
        self.assertEqual(
            self.client.post(forgot_url, {"email": "nobody@example.com"}, format="json").status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            self.client.post(forgot_url, {"email": "nobody@example.com"}, format="json").status_code,
            status.HTTP_429_TOO_MANY_REQUESTS,
        )

        self.client.force_authenticate(user=self.candidate_user)
        ai_url = reverse("improvement_generate")
        self.assertEqual(
            self.client.post(ai_url, {"target_role": "Backend"}, format="json").status_code,
            status.HTTP_201_CREATED,
        )
        self.assertEqual(
            self.client.post(ai_url, {"target_role": "Backend"}, format="json").status_code,
            status.HTTP_429_TOO_MANY_REQUESTS,
        )

    @override_settings(MAX_REQUEST_BODY_BYTES=64)
    def test_middleware_rejects_oversized_payload_and_bad_content_length(self):
        url = reverse("job-list")
        resp_big = self.client.post(
            url,
            data=json.dumps({"title": "A" * 200}),
            content_type="application/json",
        )
        self.assertEqual(resp_big.status_code, 413)

        resp_bad = self.client.get(url, CONTENT_LENGTH="not-a-number")
        self.assertEqual(resp_bad.status_code, 400)

    @override_settings(GLOBAL_IP_BURST_LIMIT=2)
    def test_middleware_global_ip_burst_limit_returns_429_with_retry_after(self):
        url = reverse("job-list")
        self.assertEqual(self.client.get(url).status_code, 200)
        self.assertEqual(self.client.get(url).status_code, 200)
        r3 = self.client.get(url)
        self.assertEqual(r3.status_code, 429)
        self.assertIn("Retry-After", r3.headers)

    def test_security_headers_and_auth_no_store_cache_control(self):
        self.client.force_authenticate(user=self.candidate_user)
        auth_resp = self.client.get(reverse("current_user"))
        self.assertEqual(auth_resp.status_code, 200)
        self.assertIn("Permissions-Policy", auth_resp.headers)
        self.assertIn("no-store", auth_resp.headers.get("Cache-Control", ""))
        self.assertEqual(auth_resp.headers.get("Pragma"), "no-cache")

    def test_resume_upload_validates_extension_signature_empty_and_size(self):
        self.client.force_authenticate(user=self.candidate_user)
        url = reverse("resume_upload")

        bad_ext = SimpleUploadedFile("malware.exe", b"MZ...", content_type="application/octet-stream")
        self.assertEqual(
            self.client.post(url, {"file": bad_ext}, format="multipart").status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        fake_pdf = SimpleUploadedFile("spoof.pdf", b"<html><script>alert(1)</script></html>", content_type="application/pdf")
        self.assertEqual(
            self.client.post(url, {"file": fake_pdf}, format="multipart").status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        empty_txt = SimpleUploadedFile("empty.txt", b"", content_type="text/plain")
        self.assertEqual(
            self.client.post(url, {"file": empty_txt}, format="multipart").status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        with patch("apps.resumes.views.MAX_RESUME_UPLOAD_BYTES", 10):
            too_big = SimpleUploadedFile("big.pdf", b"%PDF-1.4 too big payload", content_type="application/pdf")
            self.assertEqual(
                self.client.post(url, {"file": too_big}, format="multipart").status_code,
                status.HTTP_400_BAD_REQUEST,
            )

    @override_settings(DEBUG=False)
    def test_telegram_webhook_fails_closed_without_secret_in_production(self):
        url = reverse("telegram_webhook")
        with patch.dict("os.environ", {"TELEGRAM_WEBHOOK_SECRET": ""}, clear=False):
            post_resp = self.client.post(url, data=json.dumps({"update_id": 1}), content_type="application/json")
            self.assertEqual(post_resp.status_code, 403)

            get_resp = self.client.get(url)
            self.assertEqual(get_resp.status_code, 200)
            body = json.loads(get_resp.content.decode("utf-8"))
            self.assertNotIn("secret_configured", body)

        with patch.dict("os.environ", {"TELEGRAM_WEBHOOK_SECRET": "top-secret-123"}, clear=False):
            bad_secret = self.client.post(
                url,
                data=json.dumps({"update_id": 1}),
                content_type="application/json",
                HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN="wrong-secret",
            )
            self.assertEqual(bad_secret.status_code, 403)

    def test_messaging_notification_and_offer_tampering_blocked(self):
        # 1. Non-admin cannot forge notifications for another user
        self.client.force_authenticate(user=self.candidate_user)
        notif_resp = self.client.post(
            reverse("notification-list"),
            {"user": self.company_user.id, "message": "Fake admin alert"},
            format="json",
        )
        self.assertEqual(notif_resp.status_code, status.HTTP_201_CREATED)
        created_notif = Notification.objects.get(id=notif_resp.data["id"])
        self.assertEqual(created_notif.user, self.candidate_user)

        # 2. Recipient cannot rewrite message text via PATCH
        msg = Message.objects.create(sender=self.company_user, recipient=self.candidate_user, text="Original text")
        msg_url = reverse("message-detail", args=[msg.id])
        tamper_resp = self.client.patch(msg_url, {"text": "Tampered text"}, format="json")
        self.assertEqual(tamper_resp.status_code, status.HTTP_403_FORBIDDEN)
        msg.refresh_from_db()
        self.assertEqual(msg.text, "Original text")

        read_resp = self.client.patch(msg_url, {"is_read": True}, format="json")
        self.assertEqual(read_resp.status_code, status.HTTP_200_OK)

        # 3. Candidate cannot tamper with offer salary or delete offer
        job = Job.objects.create(
            company=self.company_profile,
            title="Engineer",
            description="Desc",
            status=Job.Status.PUBLISHED,
        )
        app = Application.objects.create(candidate=self.candidate_profile, job=job, status=Application.Status.OFFERED)
        offer = Offer.objects.create(application=app, salary=1500, currency="USD", message="Welcome")
        offer_url = reverse("offer-detail", args=[offer.id])

        salary_tamper = self.client.patch(offer_url, {"salary": 999999, "status": Offer.Status.ACCEPTED}, format="json")
        self.assertEqual(salary_tamper.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.delete(offer_url).status_code, status.HTTP_403_FORBIDDEN)

        accept_resp = self.client.patch(offer_url, {"status": Offer.Status.ACCEPTED}, format="json")
        self.assertEqual(accept_resp.status_code, status.HTTP_200_OK)

    @override_settings(DEBUG=False, ENABLE_DEMO_MODE=False)
    def test_api_root_minimal_in_production(self):
        resp = self.client.get("/")
        self.assertEqual(resp.status_code, 200)
        body = json.loads(resp.content.decode("utf-8"))
        self.assertEqual(
            body,
            {"project": "CareerLens REST API", "status": "online", "demo_mode": False},
        )
        self.assertNotIn("endpoints", body)
        self.assertNotIn("message", body)

    def test_bounded_pagination_caps_large_page_size(self):
        from rest_framework.request import Request
        from rest_framework.test import APIRequestFactory
        from config.pagination import BoundedPageNumberPagination

        factory = APIRequestFactory()
        drf_req = Request(factory.get("/api/jobs/", {"page_size": "999999"}))
        paginator = BoundedPageNumberPagination()
        self.assertEqual(paginator.get_page_size(drf_req), 100)

        resp = self.client.get(reverse("job-list"), {"page_size": "999999"})
        self.assertEqual(resp.status_code, 200)
        self.assertIn("results", resp.data)

