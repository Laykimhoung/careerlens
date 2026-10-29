from unittest.mock import patch, MagicMock
from telebot import types
from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from django.contrib.auth import get_user_model
from apps.accounts.models import CompanyProfile
from apps.jobs.models import Job, Skill, JobSkill
from apps.jobs.services import get_public_jobs, get_public_job_by_id, filter_jobs
from .bot import (
    create_bot,
    format_salary,
    format_job_card,
    format_job_details,
    build_job_buttons,
    build_details_buttons,
    get_web_url,
)

User = get_user_model()


class TelegramBotUnitTests(TestCase):
    def setUp(self):
        # Create company
        self.user = User.objects.create_user(
            username="test_company",
            email="company@test.com",
            password="password123",
            role=User.Role.COMPANY,
        )
        self.company = CompanyProfile.objects.create(
            user=self.user,
            company_name="Mekong Labs",
            location="Phnom Penh",
        )

        # Create skills
        self.skill_react = Skill.objects.create(name="React")
        self.skill_python = Skill.objects.create(name="Python")

        # 1. Published active job
        self.job_published = Job.objects.create(
            company=self.company,
            title="Senior React Engineer",
            description="Build scalable UI applications.",
            location="Phnom Penh",
            employment_type=Job.EmploymentType.FULL_TIME,
            workplace_type=Job.WorkplaceType.HYBRID,
            salary_min=1000,
            salary_max=2000,
            status=Job.Status.PUBLISHED,
            deadline=timezone.now() + timezone.timedelta(days=30),
        )
        JobSkill.objects.create(job=self.job_published, skill=self.skill_react)

        # 2. Draft job (must NEVER be visible to bot)
        self.job_draft = Job.objects.create(
            company=self.company,
            title="Secret Draft Job",
            description="Not ready for public eyes.",
            location="Phnom Penh",
            status=Job.Status.DRAFT,
        )

        # 3. Closed job (must NEVER be visible to bot)
        self.job_closed = Job.objects.create(
            company=self.company,
            title="Old Closed Role",
            description="Position already filled.",
            location="Phnom Penh",
            status=Job.Status.CLOSED,
        )

        # 4. Expired job (deadline in the past)
        self.job_expired = Job.objects.create(
            company=self.company,
            title="Expired Python Job",
            description="Deadline passed.",
            location="Siem Reap",
            status=Job.Status.PUBLISHED,
            deadline=timezone.now() - timezone.timedelta(days=2),
        )
        JobSkill.objects.create(job=self.job_expired, skill=self.skill_python)

    # -------------------------------------------------------------
    # 1. Job Visibility & Exclusion Rules
    # -------------------------------------------------------------
    def test_job_visibility_filters_out_draft_closed_and_expired(self):
        """Only active PUBLISHED non-expired jobs must be returned."""
        jobs = list(get_public_jobs())
        job_ids = [j.id for j in jobs]

        self.assertIn(self.job_published.id, job_ids)
        self.assertNotIn(self.job_draft.id, job_ids, "Draft jobs must be excluded from public bot")
        self.assertNotIn(self.job_closed.id, job_ids, "Closed jobs must be excluded from public bot")
        self.assertNotIn(self.job_expired.id, job_ids, "Expired jobs must be excluded from public bot")

    # -------------------------------------------------------------
    # 2. Search by Keyword & Location
    # -------------------------------------------------------------
    def test_search_by_title_keyword(self):
        results = list(get_public_jobs(search="React"))
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].id, self.job_published.id)

    def test_search_by_skill_name(self):
        results = list(get_public_jobs(search="react"))  # Case-insensitive
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].id, self.job_published.id)

    def test_search_by_company_name(self):
        results = list(get_public_jobs(search="Mekong"))
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].id, self.job_published.id)

    def test_search_by_location(self):
        results = list(get_public_jobs(location="Phnom Penh"))
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].id, self.job_published.id)

        empty_results = list(get_public_jobs(location="London"))
        self.assertEqual(len(empty_results), 0)

    # -------------------------------------------------------------
    # 3. Job Details Formatting & Field Validation
    # -------------------------------------------------------------
    def test_format_salary(self):
        self.assertEqual(format_salary(1000, 2000), "$1,000 - $2,000")
        self.assertEqual(format_salary(1500, 1500), "$1,500")
        self.assertEqual(format_salary(800, None), "From $800")
        self.assertEqual(format_salary(None, 2500), "Up to $2,500")
        self.assertEqual(format_salary(None, None), "Negotiable")

    def test_format_job_card_contains_metadata(self):
        card = format_job_card(self.job_published)
        self.assertIn("Senior React Engineer", card)
        self.assertIn("Mekong Labs", card)
        self.assertIn("Phnom Penh", card)
        self.assertIn("$1,000 - $2,000", card)
        self.assertIn("React", card)

    def test_format_job_details_contains_description_and_deadline(self):
        details = format_job_details(self.job_published)
        self.assertIn("Build scalable UI applications.", details)
        self.assertIn("Application Deadline:", details)

    # -------------------------------------------------------------
    # 4. Invalid or Nonexistent Job ID Handling
    # -------------------------------------------------------------
    def test_get_public_job_by_id_valid(self):
        job = get_public_job_by_id(self.job_published.id)
        self.assertIsNotNone(job)
        self.assertEqual(job.title, "Senior React Engineer")

    def test_get_public_job_by_id_invalid_returns_none(self):
        self.assertIsNone(get_public_job_by_id(999999))
        self.assertIsNone(get_public_job_by_id(self.job_draft.id), "Draft job must return None")
        self.assertIsNone(get_public_job_by_id(self.job_closed.id), "Closed job must return None")
        self.assertIsNone(get_public_job_by_id(self.job_expired.id), "Expired job must return None")

    # -------------------------------------------------------------
    # 5. Website Application Links
    # -------------------------------------------------------------
    def test_apply_url_points_to_candidate_job_route(self):
        web_url = get_web_url()
        expected_url = f"{web_url}/candidate/jobs/{self.job_published.id}"

        markup = build_job_buttons(self.job_published.id)
        apply_buttons = [
            b for row in markup.keyboard for b in row if b.text == "🚀 Apply on CareerLens"
        ]
        self.assertEqual(len(apply_buttons), 1)
        self.assertEqual(apply_buttons[0].url, expected_url)

        details_markup = build_details_buttons(self.job_published.id)
        details_apply_buttons = [
            b for row in details_markup.keyboard for b in row if b.text == "🚀 Apply on CareerLens"
        ]
        self.assertEqual(len(details_apply_buttons), 1)
        self.assertEqual(details_apply_buttons[0].url, expected_url)

    # -------------------------------------------------------------
    # 6. Telegram Webhook Endpoint Verification
    # -------------------------------------------------------------
    def test_webhook_get_status(self):
        url = reverse("telegram_webhook")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["service"], "CareerLens Telegram Bot Webhook")

    @patch.dict("os.environ", {"TELEGRAM_WEBHOOK_SECRET": "SuperSecretToken123"})
    def test_webhook_post_rejects_invalid_secret_token(self):
        url = reverse("telegram_webhook")
        response = self.client.post(
            url,
            data='{"update_id": 1}',
            content_type="application/json",
            HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN="WrongToken",
        )
        self.assertEqual(response.status_code, 403)

    @patch.dict("os.environ", {"TELEGRAM_WEBHOOK_SECRET": "SuperSecretToken123"})
    def test_webhook_post_accepts_valid_secret_token(self):
        url = reverse("telegram_webhook")
        response = self.client.post(
            url,
            data='{"update_id": 1}',
            content_type="application/json",
            HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN="SuperSecretToken123",
        )
        self.assertEqual(response.status_code, 200)

    # -------------------------------------------------------------
    # 7. Bot Handler Logic (Mocked TeleBot Messages)
    # -------------------------------------------------------------
    def _make_msg(self, text, chat_id=12345):
        return types.Message.de_json({
            "message_id": 1,
            "from": {"id": 1, "is_bot": False, "first_name": "TestUser"},
            "chat": {"id": chat_id, "type": "private"},
            "date": 1700000000,
            "text": text,
        })

    def _make_callback(self, data, chat_id=12345):
        return types.CallbackQuery.de_json({
            "id": "cb1",
            "from": {"id": 1, "is_bot": False, "first_name": "TestUser"},
            "chat_instance": "ci1",
            "data": data,
            "message": {
                "message_id": 1,
                "from": {"id": 99, "is_bot": True, "first_name": "Bot"},
                "chat": {"id": chat_id, "type": "private"},
                "date": 1700000000,
                "text": "menu",
            },
        })

    def test_bot_start_handler(self):
        bot = create_bot()
        msg = self._make_msg("/start")

        with patch.object(bot, "send_message") as mock_send:
            bot.process_new_messages([msg])
            mock_send.assert_called_once()
            args, kwargs = mock_send.call_args
            self.assertEqual(args[0], 12345)
            self.assertIn("Welcome to CareerLens Bot!", args[1])

    def test_bot_jobs_handler(self):
        bot = create_bot()
        msg = self._make_msg("/jobs")

        with patch.object(bot, "send_message") as mock_send:
            bot.process_new_messages([msg])
            self.assertGreaterEqual(mock_send.call_count, 2)
            first_call_text = mock_send.call_args_list[0][0][1]
            self.assertIn("Latest Published Jobs", first_call_text)

    def test_bot_search_handler_with_results(self):
        bot = create_bot()
        msg = self._make_msg("/search React")

        with patch.object(bot, "send_message") as mock_send:
            bot.process_new_messages([msg])
            self.assertGreaterEqual(mock_send.call_count, 2)
            card_text = mock_send.call_args_list[1][0][1]
            self.assertIn("Senior React Engineer", card_text)

    def test_bot_search_handler_empty_query_shows_usage(self):
        bot = create_bot()
        msg = self._make_msg("/search")

        with patch.object(bot, "send_message") as mock_send:
            bot.process_new_messages([msg])
            mock_send.assert_called_once()
            args, kwargs = mock_send.call_args
            self.assertIn("Please provide a search keyword", args[1])

    def test_bot_job_detail_command_invalid_id(self):
        bot = create_bot()
        msg = self._make_msg("/job 999999")

        with patch.object(bot, "send_message") as mock_send:
            bot.process_new_messages([msg])
            mock_send.assert_called_once()
            args, kwargs = mock_send.call_args
            self.assertIn("Job #999999 not found", args[1])

    def test_bot_callback_query_job_details(self):
        bot = create_bot()
        cb = self._make_callback(f"job_{self.job_published.id}")

        with patch.object(bot, "send_message") as mock_send, patch.object(bot, "answer_callback_query"):
            bot.process_new_callback_query([cb])
            mock_send.assert_called_once()
            args, kwargs = mock_send.call_args
            self.assertIn("Senior React Engineer", args[1])
            self.assertIn("Build scalable UI applications.", args[1])
