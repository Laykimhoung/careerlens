import os
import sys
from django.core.management.base import BaseCommand, CommandError
from apps.telegram_bot.bot import create_bot, get_web_url


class Command(BaseCommand):
    help = "Runs the CareerLens Telegram bot in polling mode for local development and testing."

    def add_arguments(self, parser):
        parser.add_argument(
            "--token",
            type=str,
            default=None,
            help="Optional bot token override (defaults to TELEGRAM_BOT_TOKEN environment variable).",
        )

    def handle(self, *args, **options):
        token = options.get("token") or os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
        if not token:
            raise CommandError(
                "TELEGRAM_BOT_TOKEN is not configured in your environment or .env file.\n"
                "Please add TELEGRAM_BOT_TOKEN=your_token to backend/.env or pass --token=<token>."
            )

        self.stdout.write(self.style.MIGRATE_HEADING("=== CareerLens Telegram Bot Launcher ==="))
        self.stdout.write("Initializing TeleBot in long-polling mode...")

        try:
            bot = create_bot(token=token)
            bot_info = bot.get_me()
        except Exception as exc:
            raise CommandError(f"Failed to authenticate with Telegram API: {exc}")

        web_url = get_web_url()

        self.stdout.write(self.style.SUCCESS(f"Connected successfully as @{bot_info.username}!"))
        self.stdout.write(f"• Bot Name    : {bot_info.first_name}")
        self.stdout.write(f"• Bot ID      : {bot_info.id}")
        self.stdout.write(f"• Frontend URL: {web_url}")
        self.stdout.write(f"• Mode        : Long Polling (Local Dev)")
        self.stdout.write(self.style.WARNING("\nWaiting for incoming messages... Press Ctrl+C to stop.\n"))

        # In case a webhook was previously registered on this bot, remove it so polling works
        try:
            bot.delete_webhook(drop_pending_updates=False)
        except Exception as e:
            self.stdout.write(self.style.NOTICE(f"Note: delete_webhook notice: {e}"))

        try:
            bot.infinity_polling(timeout=20, long_polling_timeout=10)
        except KeyboardInterrupt:
            self.stdout.write(self.style.SUCCESS("\nTelegram bot stopped gracefully."))
            sys.exit(0)

