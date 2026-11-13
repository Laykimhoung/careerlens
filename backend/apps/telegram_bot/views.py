import hmac
import os
import json
import logging
from django.conf import settings
from django.views import View
from django.http import HttpResponse, JsonResponse, HttpResponseForbidden, HttpResponseBadRequest
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from telebot import types
from .bot import create_bot

logger = logging.getLogger(__name__)
MAX_WEBHOOK_BODY_BYTES = 1024 * 1024  # 1 MB

# Single instance of configured bot for webhook processing
_bot_instance = None


def get_bot():
    global _bot_instance
    if _bot_instance is None:
        _bot_instance = create_bot()
    return _bot_instance


@method_decorator(csrf_exempt, name="dispatch")
class TelegramWebhookView(View):
    """
    Receives incoming webhook updates from Telegram Bot API.
    - POST: Verifies secret token, parses update, and dispatches to bot handlers.
    - GET: Health check endpoint reporting webhook readiness.
    """

    def get(self, request, *args, **kwargs):
        bot_token_set = bool(os.getenv("TELEGRAM_BOT_TOKEN", "").strip())
        secret_set = bool(os.getenv("TELEGRAM_WEBHOOK_SECRET", "").strip())
        payload = {
            "service": "CareerLens Telegram Bot Webhook",
            "status": "ready" if bot_token_set else "unconfigured",
        }
        if settings.DEBUG:
            payload["bot_configured"] = bot_token_set
            payload["secret_configured"] = secret_set
        return JsonResponse(payload)

    def post(self, request, *args, **kwargs):
        # 1. Validate Secret Token (fail closed in production when unconfigured)
        expected_secret = os.getenv("TELEGRAM_WEBHOOK_SECRET", "").strip()
        if not expected_secret:
            if not settings.DEBUG:
                logger.error("TELEGRAM_WEBHOOK_SECRET is not configured in production.")
                return HttpResponseForbidden("Forbidden: Webhook secret not configured.")
        else:
            incoming_secret = request.headers.get("X-Telegram-Bot-Api-Secret-Token", "")
            if not hmac.compare_digest(incoming_secret, expected_secret):
                logger.warning("Telegram webhook received request with invalid secret token.")
                return HttpResponseForbidden("Forbidden: Invalid secret token.")

        if len(request.body or b"") > MAX_WEBHOOK_BODY_BYTES:
            return HttpResponse("Payload too large.", status=413)

        # 2. Parse JSON Payload
        try:
            body_text = request.body.decode("utf-8")
            if not body_text:
                return HttpResponseBadRequest("Empty payload.")
            data = json.loads(body_text)
        except (UnicodeDecodeError, json.JSONDecodeError) as err:
            logger.error("Failed to decode Telegram webhook payload: %s", err)
            return HttpResponseBadRequest("Invalid JSON.")

        # 3. Process Update
        try:
            bot = get_bot()
            update = types.Update.de_json(data)
            if update:
                bot.process_new_updates([update])
        except Exception as exc:
            logger.exception("Error processing Telegram update: %s", exc)
            return HttpResponse("Processed with errors", status=200)

        return HttpResponse("OK", status=200)

