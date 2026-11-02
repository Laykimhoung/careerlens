import os
import html
import telebot
from telebot import types
from apps.jobs.services import get_public_jobs, get_public_job_by_id


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
    emp_type = html.escape(job.get_employment_type_display())
    work_type = html.escape(job.get_workplace_type_display())
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
    desc = html.escape(job.description or "No description provided.")
    # Telegram messages have a 4096 character limit; trim description if excessively long
    if len(desc) > 2000:
        desc = desc[:2000] + "... <i>(continued on website)</i>"

    details = (
        f"{card}"
        f"📅 <b>Application Deadline:</b> {deadline_text}\n\n"
        f"📝 <b>Job Description:</b>\n{desc}\n"
    )
    return details


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
        bot.send_message(message.chat.id, welcome_text, parse_mode="HTML")

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
            "official application form on our website."
        )
        bot.send_message(message.chat.id, help_text, parse_mode="HTML")

    @bot.message_handler(commands=["jobs"])
    def handle_jobs(message):
        jobs = get_public_jobs(limit=5)
        if not jobs:
            bot.send_message(
                message.chat.id,
                "ℹ️ No active job listings found at this time. Please check back later!",
                parse_mode="HTML",
            )
            return

        bot.send_message(
            message.chat.id,
            f"🔍 <b>Latest Published Jobs ({len(jobs)}):</b>",
            parse_mode="HTML",
        )
        for job in jobs:
            text = format_job_card(job)
            markup = build_job_buttons(job.id)
            bot.send_message(message.chat.id, text, reply_markup=markup, parse_mode="HTML")

    @bot.message_handler(commands=["search"])
    def handle_search(message):
        parts = message.text.split(maxsplit=1)
        if len(parts) < 2 or not parts[1].strip():
            bot.send_message(
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
            bot.send_message(
                message.chat.id,
                f"❌ No published jobs found matching <i>'{html.escape(query)}'</i>.\n\n"
                "Try searching for broader keywords like <code>React</code>, <code>Python</code>, "
                "or <code>Remote</code>, or use /jobs to view all recent listings.",
                parse_mode="HTML",
            )
            return

        bot.send_message(
            message.chat.id,
            f"🔎 <b>Found {len(jobs)} jobs matching '{html.escape(query)}':</b>",
            parse_mode="HTML",
        )
        for job in jobs:
            text = format_job_card(job)
            markup = build_job_buttons(job.id)
            bot.send_message(message.chat.id, text, reply_markup=markup, parse_mode="HTML")

    @bot.message_handler(commands=["job"])
    def handle_job_detail_command(message):
        parts = message.text.split()
        if len(parts) < 2 or not parts[1].isdigit():
            bot.send_message(
                message.chat.id,
                "⚠️ <b>Please specify a numeric job ID.</b>\n\n"
                "<i>Example:</i> <code>/job 5</code>",
                parse_mode="HTML",
            )
            return

        job_id = int(parts[1])
        job = get_public_job_by_id(job_id)
        if not job:
            bot.send_message(
                message.chat.id,
                f"❌ <b>Job #{job_id} not found</b> or is no longer accepting applications.\n\n"
                "Use /jobs to browse available positions.",
                parse_mode="HTML",
            )
            return

        text = format_job_details(job)
        markup = build_details_buttons(job.id)
        bot.send_message(message.chat.id, text, reply_markup=markup, parse_mode="HTML")

    @bot.callback_query_handler(func=lambda call: True)
    def handle_callbacks(call):
        if call.data == "browse_jobs":
            jobs = get_public_jobs(limit=5)
            if not jobs:
                bot.answer_callback_query(call.id, "No active jobs found.")
                return
            bot.answer_callback_query(call.id)
            bot.send_message(
                call.message.chat.id,
                f"🔍 <b>Latest Published Jobs ({len(jobs)}):</b>",
                parse_mode="HTML",
            )
            for job in jobs:
                text = format_job_card(job)
                markup = build_job_buttons(job.id)
                bot.send_message(call.message.chat.id, text, reply_markup=markup, parse_mode="HTML")
            return

        if call.data.startswith("job_"):
            try:
                job_id = int(call.data.split("_")[1])
            except (IndexError, ValueError):
                bot.answer_callback_query(call.id, "Invalid job selection.")
                return

            job = get_public_job_by_id(job_id)
            if not job:
                bot.answer_callback_query(call.id, "Job is no longer available.")
                bot.send_message(
                    call.message.chat.id,
                    f"❌ <b>Job #{job_id} not found</b> or has been closed.\n"
                    "Use /jobs to browse active listings.",
                    parse_mode="HTML",
                )
                return

            bot.answer_callback_query(call.id)
            text = format_job_details(job)
            markup = build_details_buttons(job.id)
            bot.send_message(call.message.chat.id, text, reply_markup=markup, parse_mode="HTML")


def create_bot(token=None):
    """
    Factory function to instantiate and configure TeleBot.
    If no token is supplied, falls back to the TELEGRAM_BOT_TOKEN environment variable.
    """
    bot_token = token or os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    # If no token is configured, use a safe dummy token so imports/tests do not crash
    effective_token = bot_token if bot_token else "0000000000:AAPlaceholderDummyTokenForTesting000"
    bot = telebot.TeleBot(effective_token, threaded=False)
    register_handlers(bot)
    return bot

