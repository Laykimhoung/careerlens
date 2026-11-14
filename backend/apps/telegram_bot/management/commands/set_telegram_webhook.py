import os
from urllib.parse import urlparse

from django.core.management.base import BaseCommand, CommandError

from apps.telegram_bot.bot import create_bot, sync_bot_commands


class Command(BaseCommand):
    help = "Registers, inspects, or deletes the CareerLens Telegram webhook with a secret token."

    def add_arguments(self, parser):
        parser.add_argument(
            "--url",
            type=str,
            default=None,
            help="Public HTTPS webhook URL (defaults to TELEGRAM_WEBHOOK_URL env var).",
        )
        parser.add_argument(
            "--secret",
            type=str,
            default=None,
            help="Webhook secret token (defaults to TELEGRAM_WEBHOOK_SECRET env var).",
        )
        parser.add_argument(
            "--token",
            type=str,
            default=None,
            help="Bot token override (defaults to TELEGRAM_BOT_TOKEN env var).",
        )
        parser.add_argument(
            "--drop-pending",
            action="store_true",
            help="Drop pending Telegram updates when setting or deleting the webhook.",
        )
        parser.add_argument(
            "--info",
            action="store_true",
            help="Show current Telegram webhook info without making changes.",
        )
        parser.add_argument(
            "--delete",
            action="store_true",
            help="Delete the active Telegram webhook (for switching back to polling).",
        )

    def handle(self, *args, **options):
        token = (options.get("token") or os.getenv("TELEGRAM_BOT_TOKEN", "")).strip()
        if not token:
            raise CommandError("TELEGRAM_BOT_TOKEN is not configured.")

        bot = create_bot(token=token)

        if options.get("info"):
            info = bot.get_webhook_info()
            self.stdout.write(f"Webhook URL     : {info.url or '<none>'}")
            self.stdout.write(f"Pending updates : {info.pending_update_count}")
            self.stdout.write(f"Last error      : {info.last_error_message or '<none>'}")
            return

        if options.get("delete"):
            bot.delete_webhook(drop_pending_updates=bool(options.get("drop_pending")))
            self.stdout.write(self.style.SUCCESS("Telegram webhook deleted."))
            return

        webhook_url = (options.get("url") or os.getenv("TELEGRAM_WEBHOOK_URL", "")).strip()
        parsed = urlparse(webhook_url)
        if parsed.scheme != "https" or not parsed.netloc:
            raise CommandError(
                "A valid HTTPS webhook URL is required via --url or TELEGRAM_WEBHOOK_URL "
                "(e.g. https://your-api.onrender.com/api/telegram/webhook/)."
            )

        secret = (options.get("secret") or os.getenv("TELEGRAM_WEBHOOK_SECRET", "")).strip()
        if not secret:
            raise CommandError(
                "TELEGRAM_WEBHOOK_SECRET is required via --secret or environment variable "
                "because production TelegramWebhookView rejects unsigned requests."
            )

        bot.set_webhook(
            url=webhook_url,
            secret_token=secret,
            drop_pending_updates=bool(options.get("drop_pending")),
        )
        sync_bot_commands(bot)
        self.stdout.write(self.style.SUCCESS(f"Webhook registered: {webhook_url}"))
