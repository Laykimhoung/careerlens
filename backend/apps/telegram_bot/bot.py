import os
import re
import html
import logging
import telebot
from telebot import types
from apps.jobs.services import get_public_jobs, get_public_job_by_id

logger = logging.getLogger(__name__)


def get_web_url():
    """Returns the configured public frontend URL, defaulting to local dev or production URL."""
    raw_url = os.getenv(
        "CAREERLENS_WEB_URL",
        "https://careerlens-ivory-ten.vercel.app",
    ).strip()
    if "," in raw_url:
        raw_url = raw_url.split(",")[0].strip()
    return raw_url.rstrip("/")


def format_salary(salary_min, salary_max):
    """Formats salary range into a human-readable string."""
    if salary_min is not None and salary_max is not None:
        if salary_min == salary_max:
            return f"${salary_min:,.0f}"
        return f"${salary_min:,.0f} - ${salary_max:,.0f}"
    elif salary_min is not None:
        return f"From ${salary_min:,.0f}"
    elif salary_max is not None:
        return f"Up to ${salary_max:,.0f}"
    return "Negotiable"


def format_job_card(job):
    """Formats a concise job summary card for list and search views."""
    title = html.escape(job.title)
    company = html.escape(job.company.company_name if job.company else "Unknown Company")
    location = html.escape(job.location or "Location not specified")
    emp_type = html.escape(job.get_employment_type_display() if hasattr(job, 'get_employment_type_display') else str(job.employment_type))
    work_type = html.escape(job.get_workplace_type_display() if hasattr(job, 'get_workplace_type_display') else str(job.workplace_type))
    salary = format_salary(job.salary_min, job.salary_max)

    skills_list = [html.escape(js.skill.name) for js in job.job_skills.all() if js.skill]
    skills_text = ", ".join(skills_list) if skills_list else "None specified"

    card = (
        f"💼 <b>{title}</b>\n"
        f"🏢 <b>Company:</b> {company}\n"
        f"📍 <b>Location:</b> {location}\n"
        f"⏱ <b>Type:</b> {emp_type} ({work_type})\n"
        f"💰 <b>Salary:</b> {salary}\n"
        f"🛠 <b>Skills:</b> {skills_text}\n"
    )
    return card


def format_job_details(job):
    """Formats full job details for the detail view."""
    card = format_job_card(job)

    deadline_text = job.deadline.strftime("%B %d, %Y") if job.deadline else "Open until filled"
    raw_desc = job.description or "No description provided."
    # Strip HTML tags from rich editor if present to prevent malformed nested markup
    clean_desc = re.sub(r"<[^>]+>", " ", raw_desc)
    clean_desc = " ".join(clean_desc.split())
    clean_desc = html.escape(clean_desc)
    if len(clean_desc) > 1800:
        clean_desc = clean_desc[:1800] + "... <i>(continued on website)</i>"

    details = (
        f"{card}"
        f"📅 <b>Application Deadline:</b> {deadline_text}\n\n"
        f"📝 <b>Job Description:</b>\n{clean_desc}\n"
    )
    return details


def build_main_keyboard():
    """Builds persistent reply keyboard with quick-access menu buttons."""
    markup = types.ReplyKeyboardMarkup(resize_keyboard=True, row_width=2)
    btn_jobs = types.KeyboardButton("📋 Browse Jobs")
    btn_search = types.KeyboardButton("🔍 Search Jobs")
    btn_remote = types.KeyboardButton("🌐 Remote Jobs")
    btn_help = types.KeyboardButton("💡 Help & Guide")
    markup.add(btn_jobs, btn_search)
    markup.add(btn_remote, btn_help)
    return markup


def build_job_buttons(job_id):
    """Builds inline keyboard with 'View Details' callback and 'Apply on CareerLens' direct link."""
    web_url = get_web_url()
    apply_url = f"{web_url}/candidate/jobs/{job_id}"

    markup = types.InlineKeyboardMarkup(row_width=2)
    details_btn = types.InlineKeyboardButton("🔎 View Details", callback_data=f"job_{job_id}")
    apply_btn = types.InlineKeyboardButton("🚀 Apply on CareerLens", url=apply_url)
    markup.add(details_btn, apply_btn)
    return markup


def build_details_buttons(job_id):
    """Builds inline keyboard for the full details view with an Apply link and Back to Jobs button."""
    web_url = get_web_url()
    apply_url = f"{web_url}/candidate/jobs/{job_id}"

    markup = types.InlineKeyboardMarkup(row_width=1)
    apply_btn = types.InlineKeyboardButton("🚀 Apply on CareerLens", url=apply_url)
    back_btn = types.InlineKeyboardButton("📋 Browse More Jobs", callback_data="browse_jobs")
    markup.add(apply_btn, back_btn)
    return markup


def send_safe_message(bot, chat_id, text, reply_markup=None, parse_mode="HTML"):
    """
    Safely sends a message to Telegram.
    Enforces Telegram's 4096 character limit and gracefully falls back
    to plain text if HTML entities fail to parse so the bot never fails to respond.
    """
    if len(text) > 4000:
        text = text[:4000] + "..."
    try:
        return bot.send_message(chat_id, text, reply_markup=reply_markup, parse_mode=parse_mode)
    except Exception as e:
        logger.warning("Telegram send_message error with parse_mode=%s: %s. Falling back to plain text.", parse_mode, e)
        plain_text = re.sub(r"<[^>]+>", "", text)
        plain_text = html.unescape(plain_text)
        return bot.send_message(chat_id, plain_text, reply_markup=reply_markup)


def register_handlers(bot):
    """Registers all command, message, and callback handlers on the telebot instance."""

    @bot.message_handler(commands=["start"])
    def handle_start(message):
        welcome_text = (
            "👋 <b>Welcome to CareerLens Bot!</b>\n\n"
            "CareerLens connects ambitious candidates with top tech companies.\n"
            "Browse public job openings and apply directly through our platform.\n\n"
            "<b>Available Commands:</b>\n"
            "🔹 /jobs — Browse latest published job listings\n"
            "🔹 /search &lt;keyword&gt; — Search jobs by title, company, or skill\n"
            "🔹 /job &lt;id&gt; — View full details for a specific job ID\n"
            "🔹 /help — Learn how to use this bot\n\n"
            "<i>No login required to browse jobs! To apply, tap 'Apply on CareerLens' on any listing.</i>"
        )
        send_safe_message(bot, message.chat.id, welcome_text, reply_markup=build_main_keyboard(), parse_mode="HTML")

    @bot.message_handler(commands=["help"])
    def handle_help(message):
        help_text = (
            "📖 <b>CareerLens Bot Help & Commands:</b>\n\n"
            "• <b>/jobs</b>\n"
            "  Shows the 5 most recently published jobs.\n\n"
            "• <b>/search &lt;keyword&gt;</b>\n"
            "  Searches jobs matching a role, company, skill, or location.\n"
            "  <i>Examples:</i>\n"
            "    <code>/search React</code>\n"
            "    <code>/search Python Phnom Penh</code>\n"
            "    <code>/search Remote</code>\n\n"
            "• <b>/job &lt;id&gt;</b>\n"
            "  View the full description and requirements for job &lt;id&gt;.\n"
            "  <i>Example:</i> <code>/job 12</code>\n\n"
            "• <b>Applying for a Job:</b>\n"
            "  Tap the <b>'🚀 Apply on CareerLens'</b> button below any job to open the "
            "official application form on our website.\n\n"
            "💡 <i>Tip: You can also just type any job title or skill directly into chat to search!</i>"
        )
        send_safe_message(bot, message.chat.id, help_text, reply_markup=build_main_keyboard(), parse_mode="HTML")

    @bot.message_handler(commands=["jobs"])
    def handle_jobs(message):
        jobs = get_public_jobs(limit=5)
        if not jobs:
            send_safe_message(
                bot,
                message.chat.id,
                "ℹ️ No active job listings found at this time. Please check back later!",
                parse_mode="HTML",
            )
            return

        send_safe_message(
            bot,
            message.chat.id,
            f"🔍 <b>Latest Published Jobs ({len(jobs)}):</b>",
            parse_mode="HTML",
        )
        for job in jobs:
            text = format_job_card(job)
            markup = build_job_buttons(job.id)
            send_safe_message(bot, message.chat.id, text, reply_markup=markup, parse_mode="HTML")

    @bot.message_handler(commands=["search"])
    def handle_search(message):
        parts = message.text.split(maxsplit=1)
        if len(parts) < 2 or not parts[1].strip():
            send_safe_message(
                bot,
                message.chat.id,
                "⚠️ <b>Please provide a search keyword.</b>\n\n"
                "<i>Usage:</i> <code>/search &lt;keyword&gt; [location]</code>\n"
                "<i>Example:</i> <code>/search React</code> or <code>/search Python Phnom Penh</code>",
                parse_mode="HTML",
            )
            return

        query = parts[1].strip()
        jobs = get_public_jobs(search=query, limit=5)

        if not jobs:
            send_safe_message(
                bot,
                message.chat.id,
                f"❌ No published jobs found matching <i>'{html.escape(query)}'</i>.\n\n"
                "Try searching for broader keywords like <code>React</code>, <code>Python</code>, "
                "or <code>Remote</code>, or use /jobs to view all recent listings.",
                parse_mode="HTML",
            )
            return

        send_safe_message(
            bot,
            message.chat.id,
            f"🔎 <b>Found {len(jobs)} jobs matching '{html.escape(query)}':</b>",
            parse_mode="HTML",
        )
        for job in jobs:
            text = format_job_card(job)
            markup = build_job_buttons(job.id)
            send_safe_message(bot, message.chat.id, text, reply_markup=markup, parse_mode="HTML")

    @bot.message_handler(commands=["job"])
    def handle_job_detail_command(message):
        parts = message.text.split()
        if len(parts) < 2 or not parts[1].isdigit():
            send_safe_message(
                bot,
                message.chat.id,
                "⚠️ <b>Please specify a numeric job ID.</b>\n\n"
                "<i>Example:</i> <code>/job 5</code>",
                parse_mode="HTML",
            )
            return

        job_id = int(parts[1])
        job = get_public_job_by_id(job_id)
        if not job:
            send_safe_message(
                bot,
                message.chat.id,
                f"❌ <b>Job #{job_id} not found</b> or is no longer accepting applications.\n\n"
                "Use /jobs to browse available positions.",
                parse_mode="HTML",
            )
            return

        text = format_job_details(job)
        markup = build_details_buttons(job.id)
        send_safe_message(bot, message.chat.id, text, reply_markup=markup, parse_mode="HTML")

    @bot.callback_query_handler(func=lambda call: True)
    def handle_callbacks(call):
        try:
            if call.data == "browse_jobs" or call.data == "filter_all":
                jobs = get_public_jobs(limit=5)
                try:
                    bot.answer_callback_query(call.id)
                except Exception:
                    pass
                if not jobs:
                    send_safe_message(bot, call.message.chat.id, "ℹ️ No active job listings found at this time.", parse_mode="HTML")
                    return
                send_safe_message(
                    bot,
                    call.message.chat.id,
                    f"🔍 <b>Latest Published Jobs ({len(jobs)}):</b>",
                    parse_mode="HTML",
                )
                for job in jobs:
                    text = format_job_card(job)
                    markup = build_job_buttons(job.id)
                    send_safe_message(bot, call.message.chat.id, text, reply_markup=markup, parse_mode="HTML")
                return

            if call.data == "filter_remote":
                try:
                    bot.answer_callback_query(call.id)
                except Exception:
                    pass
                jobs = get_public_jobs(search="Remote", limit=5)
                if not jobs:
                    send_safe_message(bot, call.message.chat.id, "ℹ️ No remote job listings found right now. Tap <b>📋 Browse Jobs</b> to see all roles.", parse_mode="HTML")
                    return
                send_safe_message(bot, call.message.chat.id, f"🌐 <b>Remote Job Openings ({len(jobs)}):</b>", parse_mode="HTML")
                for job in jobs:
                    text = format_job_card(job)
                    markup = build_job_buttons(job.id)
                    send_safe_message(bot, call.message.chat.id, text, reply_markup=markup, parse_mode="HTML")
                return

            if call.data.startswith("job_"):
                try:
                    job_id = int(call.data.split("_")[1])
                except (IndexError, ValueError):
                    try:
                        bot.answer_callback_query(call.id, "Invalid job selection.")
                    except Exception:
                        pass
                    return

                job = get_public_job_by_id(job_id)
                if not job:
                    try:
                        bot.answer_callback_query(call.id, "Job is no longer available.")
                    except Exception:
                        pass
                    send_safe_message(
                        bot,
                        call.message.chat.id,
                        f"❌ <b>Job #{job_id} not found</b> or has been closed.\n"
                        "Use /jobs to browse active listings.",
                        parse_mode="HTML",
                    )
                    return

                try:
                    bot.answer_callback_query(call.id)
                except Exception:
                    pass
                text = format_job_details(job)
                markup = build_details_buttons(job.id)
                send_safe_message(bot, call.message.chat.id, text, reply_markup=markup, parse_mode="HTML")
                return

        except Exception as e:
            logger.exception("Error in callback handler: %s", e)
            try:
                bot.answer_callback_query(call.id, "An error occurred.")
            except Exception:
                pass

    # =========================================================================
    # Natural Language & Free-Text Message Handler (Solves "no response" issue)
    # =========================================================================
    @bot.message_handler(func=lambda msg: True, content_types=["text"])
    def handle_natural_text(message):
        raw_text = (message.text or "").strip()
        if not raw_text or raw_text.startswith("/"):
            return

        lower = raw_text.lower()

        # 1. Quick Menu Buttons
        if lower in ["📋 browse jobs", "📋 latest jobs", "jobs", "browse", "list", "show jobs"]:
            return handle_jobs(message)

        if lower in ["🌐 remote jobs", "remote", "remote jobs"]:
            jobs = get_public_jobs(search="Remote", limit=5)
            if not jobs:
                send_safe_message(bot, message.chat.id, "ℹ️ No remote job listings found right now. Tap <b>📋 Browse Jobs</b> to see all roles.", parse_mode="HTML")
                return
            send_safe_message(bot, message.chat.id, f"🌐 <b>Remote Job Openings ({len(jobs)}):</b>", parse_mode="HTML")
            for job in jobs:
                text = format_job_card(job)
                markup = build_job_buttons(job.id)
                send_safe_message(bot, message.chat.id, text, reply_markup=markup, parse_mode="HTML")
            return

        if lower in ["🔍 search jobs", "search"]:
            prompt = (
                "🔍 <b>What kind of role are you looking for?</b>\n\n"
                "Just type what you're interested in, such as:\n"
                "• <code>React Developer</code>\n"
                "• <code>Python Backend</code>\n"
                "• <code>UI/UX Designer</code>\n"
                "• <code>Internship</code>\n"
                "• <code>Phnom Penh</code>\n\n"
                "I'll search active job openings for you immediately! 🚀"
            )
            send_safe_message(bot, message.chat.id, prompt, parse_mode="HTML")
            return

        if lower in ["💡 help & guide", "help", "guide", "info"]:
            return handle_help(message)

        # 2. Greetings
        if lower in ["hi", "hello", "hey", "hola", "greetings", "good morning", "good evening", "start"]:
            welcome = (
                "👋 Hello! <b>Welcome to CareerLens!</b>\n\n"
                "I can help you find exciting job openings in tech, view requirements, and apply directly.\n\n"
                "Tap a button below or simply type what role you're looking for (e.g. <code>React</code>, <code>Python</code>, <code>Design</code>)!"
            )
            send_safe_message(bot, message.chat.id, welcome, reply_markup=build_main_keyboard(), parse_mode="HTML")
            return

        # 3. Numeric Job ID lookup (e.g. "12", "#12", "job 12")
        numeric_match = re.match(r"^(?:#|job\s+)?(\d+)$", lower)
        if numeric_match:
            job_id = int(numeric_match.group(1))
            job = get_public_job_by_id(job_id)
            if not job:
                send_safe_message(bot, message.chat.id, f"❌ <b>Job #{job_id} not found</b> or has expired.\nUse /jobs to browse positions.", parse_mode="HTML")
                return
            text = format_job_details(job)
            markup = build_details_buttons(job.id)
            send_safe_message(bot, message.chat.id, text, reply_markup=markup, parse_mode="HTML")
            return

        # 4. Career Advice & Platform Guidance
        if any(term in lower for term in ["interview", "resume", "cv", "tips", "career", "advice", "roadmap"]):
            advice = (
                "🎯 <b>CareerLens Career Tips:</b>\n\n"
                "• <b>AI CV Studio:</b> Upload your resume on CareerLens to get instant ATS scoring, keyword gap analysis, and tailored revisions.\n"
                "• <b>Interactive Career Roadmap:</b> Configure your dream tech role to receive step-by-step milestone guidance.\n"
                "• <b>Live Video Interviews:</b> Recruiter interview calls include one-click video rooms directly in your candidate dashboard!\n\n"
                f"👉 Visit the platform to try these features: <a href=\"{get_web_url()}\">CareerLens Web App</a>"
            )
            send_safe_message(bot, message.chat.id, advice, parse_mode="HTML")
            return

        # 5. Smart Search by default for any text
        jobs = get_public_jobs(search=raw_text, limit=5)
        if jobs:
            send_safe_message(
                bot,
                message.chat.id,
                f"🔎 <b>Found {len(jobs)} jobs matching '{html.escape(raw_text)}':</b>",
                parse_mode="HTML",
            )
            for job in jobs:
                text = format_job_card(job)
                markup = build_job_buttons(job.id)
                send_safe_message(bot, message.chat.id, text, reply_markup=markup, parse_mode="HTML")
        else:
            fallback_markup = types.InlineKeyboardMarkup()
            fallback_markup.add(types.InlineKeyboardButton("📋 Browse Latest Jobs", callback_data="browse_jobs"))
            send_safe_message(
                bot,
                message.chat.id,
                f"❌ No jobs found matching <i>'{html.escape(raw_text)}'</i>.\n\n"
                "💡 <i>Search tips:</i>\n"
                "• Try broader terms: <code>Frontend</code>, <code>Python</code>, <code>Mobile</code>\n"
                "• Try locations: <code>Phnom Penh</code>, <code>Remote</code>\n"
                "• Or tap below to browse all published positions:",
                reply_markup=fallback_markup,
                parse_mode="HTML",
            )


def create_bot(token=None):
    """
    Factory function to instantiate and configure TeleBot.
    If no token is supplied, falls back to the TELEGRAM_BOT_TOKEN environment variable.
    """
    bot_token = token or os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    effective_token = bot_token if bot_token else "0000000000:AAPlaceholderDummyTokenForTesting000"
    bot = telebot.TeleBot(effective_token, threaded=False)
    register_handlers(bot)
    return bot
