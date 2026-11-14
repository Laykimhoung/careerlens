import hashlib
import html
import logging
import os
import re
from urllib.parse import urlparse

import telebot
from django.core.cache import cache
from django.utils import timezone
from telebot import types

from apps.accounts.models import CompanyProfile
from apps.jobs.models import Job
from apps.jobs.services import get_public_job_by_id, get_public_jobs_page

logger = logging.getLogger(__name__)

PAGE_SIZE = 5
MAX_MESSAGE_LENGTH = 4000
SEARCH_CACHE_TTL = 3600  # 1 hour

FILTER_SPECS = {
    "all": {
        "pill": "All",
        "title": "Latest Published Jobs",
        "kwargs": {},
    },
    "remote": {
        "pill": "Remote",
        "title": "Remote & Hybrid Openings",
        "kwargs": {
            "workplace_type": [Job.WorkplaceType.REMOTE, Job.WorkplaceType.HYBRID],
        },
    },
    "intern": {
        "pill": "Intern",
        "title": "Internship Opportunities",
        "kwargs": {
            "employment_type": Job.EmploymentType.INTERNSHIP,
        },
    },
    "fulltime": {
        "pill": "Full-Time",
        "title": "Full-Time Positions",
        "kwargs": {
            "employment_type": Job.EmploymentType.FULL_TIME,
        },
    },
}

QUICK_SEARCH_PRESETS = [
    "React",
    "Python",
    "UI/UX",
    "DevOps",
    "Phnom Penh",
    "Internship",
]

BOT_COMMANDS = [
    types.BotCommand("start", "Open CareerLens assistant & main menu"),
    types.BotCommand("jobs", "Browse latest published jobs"),
    types.BotCommand("remote", "Filter remote & hybrid openings"),
    types.BotCommand("internships", "Browse internship opportunities"),
    types.BotCommand("search", "Search jobs by skill, role, or city"),
    types.BotCommand("job", "View full job details by ID (e.g. /job 12)"),
    types.BotCommand("help", "View guide & search tips"),
]


DEFAULT_WEB_URL = "https://careerlens-2k26.vercel.app"


def validate_http_url(raw_url):
    """
    Validates and normalizes an HTTP/HTTPS URL for Telegram buttons and links.
    Rejects localhost, local IP addresses, and invalid hostnames because
    Telegram Bot API strictly rejects them as 'Wrong HTTP URL'.
    """
    if not raw_url or not isinstance(raw_url, str):
        return None
    cleaned = raw_url.strip().strip("\"'")
    if not cleaned or any(ch.isspace() for ch in cleaned):
        return None
    parsed = urlparse(cleaned)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        return None
    hostname = (parsed.hostname or "").lower()
    if hostname in ("localhost", "127.0.0.1", "0.0.0.0", "::1") or "." not in hostname:
        return None
    return cleaned


def get_web_url():
    """
    Returns the configured public frontend URL.
    If the environment variable points to a local/invalid URL (e.g. localhost during local dev),
    it safely falls back to the production deployment URL so Telegram buttons never fail.
    """
    raw_url = os.getenv(
        "CAREERLENS_WEB_URL",
        DEFAULT_WEB_URL,
    ).strip().strip("\"'")
    if "," in raw_url:
        raw_url = raw_url.split(",")[0].strip().strip("\"'")
    validated = validate_http_url(raw_url.rstrip("/"))
    return (validated or DEFAULT_WEB_URL).rstrip("/")


def format_salary(salary_min, salary_max):
    """Formats salary range into a human-readable string."""
    if salary_min is not None and salary_max is not None:
        if salary_min == salary_max:
            return f"${salary_min:,.0f}"
        return f"${salary_min:,.0f} - ${salary_max:,.0f}"
    if salary_min is not None:
        return f"From ${salary_min:,.0f}"
    if salary_max is not None:
        return f"Up to ${salary_max:,.0f}"
    return "Negotiable"


def _to_aware_utc(dt):
    """Ensures a datetime is timezone-aware for safe arithmetic."""
    if dt is None:
        return None
    if timezone.is_naive(dt):
        return timezone.make_aware(dt, timezone.get_current_timezone())
    return dt


def format_relative_date(dt):
    """Formats a datetime into a crisp human-readable relative label."""
    if not dt:
        return "Recently"
    aware_dt = _to_aware_utc(dt)
    delta = timezone.now() - aware_dt
    days = delta.days
    if days <= 0:
        return "Today"
    if days == 1:
        return "Yesterday"
    if days < 7:
        return f"{days}d ago"
    if days < 30:
        return f"{days // 7}w ago"
    return aware_dt.strftime("%b %d, %Y")


def format_deadline_summary(deadline):
    """Formats job application deadline with remaining-time indicator."""
    if not deadline:
        return "Open until filled"
    aware_deadline = _to_aware_utc(deadline)
    date_str = aware_deadline.strftime("%B %d, %Y")
    delta_days = (aware_deadline.date() - timezone.now().date()).days
    if delta_days < 0:
        return f"{date_str} (Closed)"
    if delta_days == 0:
        return f"{date_str} (Closes today)"
    if delta_days <= 7:
        return f"{date_str} (Closing soon · {delta_days}d left)"
    return f"{date_str} ({delta_days}d left)"


def clean_html_to_telegram(raw_html, max_len=2200):
    """
    Converts rich-text HTML descriptions into clean, paragraph-preserving plain text
    escaped safely for Telegram HTML parse_mode.
    Returns (escaped_text, was_truncated).
    """
    text = (raw_html or "").strip()
    if not text:
        return html.escape("No description provided."), False

    # Preserve structural line breaks and bullet points before stripping tags
    text = re.sub(r"(?i)<br\s*/?>", "\n", text)
    text = re.sub(r"(?i)</(p|div|h[1-6]|tr|blockquote)>", "\n\n", text)
    text = re.sub(r"(?i)<li[^>]*>", "\n• ", text)
    text = re.sub(r"(?i)</li>", "", text)
    text = re.sub(r"<[^>]+>", " ", text)
    text = html.unescape(text)

    # Clean whitespace per line while retaining paragraph breaks
    lines = [" ".join(line.split()) for line in text.splitlines()]
    normalized = "\n".join(lines)
    normalized = re.sub(r"\n{3,}", "\n\n", normalized).strip()

    if not normalized:
        normalized = "No description provided."

    truncated = False
    if len(normalized) > max_len:
        truncated = True
        cut = normalized[:max_len]
        # Avoid cutting mid-word
        last_space = max(cut.rfind(" "), cut.rfind("\n"))
        if last_space > int(max_len * 0.7):
            cut = cut[:last_space]
        normalized = cut.rstrip(" .,;:-")

    return html.escape(normalized), truncated


def _company_verified_badge(company):
    if company and getattr(company, "verification_status", None) == CompanyProfile.VerificationStatus.VERIFIED:
        return " ✓"
    return ""


def _truncate_label(text, max_len=34):
    cleaned = " ".join((text or "").split())
    if len(cleaned) <= max_len:
        return cleaned
    return cleaned[: max_len - 1].rstrip() + "…"


def format_job_card(job):
    """Formats a clean, modern job summary card."""
    title = html.escape(job.title)
    company_obj = job.company
    company = html.escape(company_obj.company_name if company_obj else "Unknown Company")
    badge = _company_verified_badge(company_obj)
    industry = html.escape(company_obj.industry) if (company_obj and company_obj.industry) else ""
    company_line = f"{company}{badge}" + (f" · <i>{industry}</i>" if industry else "")

    location = html.escape(job.location or "Location not specified")
    emp_type = html.escape(
        job.get_employment_type_display() if hasattr(job, "get_employment_type_display") else str(job.employment_type)
    )
    work_type = html.escape(
        job.get_workplace_type_display() if hasattr(job, "get_workplace_type_display") else str(job.workplace_type)
    )
    salary = html.escape(format_salary(job.salary_min, job.salary_max))

    skills_list = [html.escape(js.skill.name) for js in job.job_skills.all() if js.skill]
    skills_text = " ".join(f"<code>{s}</code>" for s in skills_list[:6]) if skills_list else "<i>Not specified</i>"
    if len(skills_list) > 6:
        skills_text += f" <i>+{len(skills_list) - 6} more</i>"

    posted_str = html.escape(format_relative_date(getattr(job, "created_at", None)))
    deadline_short = job.deadline.strftime("%b %d, %Y") if job.deadline else "Open until filled"

    return (
        f"💼 <b>{title}</b>  <code>#{job.id}</code>\n"
        f"🏢 <b>Company:</b> {company_line}\n"
        f"📍 <b>Location:</b> {location} · {work_type} · {emp_type}\n"
        f"💰 <b>Salary:</b> <code>{salary}</code>\n"
        f"🛠 <b>Skills:</b> {skills_text}\n"
        f"🕒 <b>Posted:</b> {posted_str} · <b>Closes:</b> {html.escape(deadline_short)}\n"
    )


def format_job_details(job):
    """Formats comprehensive, scannable job details for the detail view."""
    title = html.escape(job.title)
    company_obj = job.company
    company_name = html.escape(company_obj.company_name if company_obj else "Unknown Company")
    is_verified = bool(
        company_obj and getattr(company_obj, "verification_status", None) == CompanyProfile.VerificationStatus.VERIFIED
    )
    company_display = f"{company_name} (Verified ✓)" if is_verified else company_name

    location = html.escape(job.location or "Location not specified")
    emp_type = html.escape(
        job.get_employment_type_display() if hasattr(job, "get_employment_type_display") else str(job.employment_type)
    )
    work_type = html.escape(
        job.get_workplace_type_display() if hasattr(job, "get_workplace_type_display") else str(job.workplace_type)
    )
    salary = html.escape(format_salary(job.salary_min, job.salary_max))
    posted_str = html.escape(format_relative_date(getattr(job, "created_at", None)))
    deadline_str = html.escape(format_deadline_summary(job.deadline))

    meta_lines = [f"🏢 <b>Company:</b> {company_display}"]
    company_extras = []
    if company_obj and company_obj.industry:
        company_extras.append(html.escape(company_obj.industry))
    if company_obj and company_obj.size:
        company_extras.append(html.escape(company_obj.size))
    if company_extras:
        meta_lines.append(f"🏭 <b>Profile:</b> {' · '.join(company_extras)}")

    meta_lines.extend([
        f"📍 <b>Location:</b> {location}",
        f"🌐 <b>Work Mode:</b> {emp_type} · {work_type}",
        f"💰 <b>Compensation:</b> <code>{salary}</code>",
        f"🕒 <b>Posted:</b> {posted_str}",
        f"📅 <b>Application Deadline:</b> {deadline_str}",
    ])

    skills_list = [html.escape(js.skill.name) for js in job.job_skills.all() if js.skill]
    skills_block = (
        "  ".join(f"<code>{s}</code>" for s in skills_list)
        if skills_list
        else "<i>No specific skills listed</i>"
    )

    clean_desc, was_truncated = clean_html_to_telegram(job.description, max_len=2100)
    if was_truncated:
        clean_desc += "\n\n<i>…continued on CareerLens website</i>"

    return (
        f"💼 <b>{title}</b>  <code>#{job.id}</code>\n\n"
        f"<blockquote>" + "\n".join(meta_lines) + "</blockquote>\n\n"
        f"🛠 <b>Required Skills</b>\n"
        f"{skills_block}\n\n"
        f"📝 <b>Role Description</b>\n"
        f"{clean_desc}\n"
    )


def format_job_list_message(jobs, total_count, page, total_pages, heading, subtitle=None):
    """Formats a compact, modern paginated directory of jobs into a single clean message."""
    start_idx = page * PAGE_SIZE + 1
    end_idx = start_idx + len(jobs) - 1

    header = f"📋 <b>{html.escape(heading)}</b>  ·  <i>{total_count} active</i>"
    sub_parts = [f"Showing {start_idx}–{end_idx} of {total_count}"]
    if total_pages > 1:
        sub_parts.append(f"Page {page + 1}/{total_pages}")
    if subtitle:
        sub_parts.insert(0, html.escape(subtitle))

    lines = [header, f"<i>{' · '.join(sub_parts)}</i>", ""]

    for idx, job in enumerate(jobs, start=1):
        title = html.escape(job.title)
        company_obj = job.company
        company = html.escape(company_obj.company_name if company_obj else "Unknown Company")
        badge = _company_verified_badge(company_obj)
        location = html.escape(job.location or "Flexible")
        work_type = html.escape(
            job.get_workplace_type_display() if hasattr(job, "get_workplace_type_display") else str(job.workplace_type)
        )
        emp_type = html.escape(
            job.get_employment_type_display() if hasattr(job, "get_employment_type_display") else str(job.employment_type)
        )
        salary = html.escape(format_salary(job.salary_min, job.salary_max))

        skills = [html.escape(js.skill.name) for js in job.job_skills.all() if js.skill]
        if skills:
            top_skills = ", ".join(skills[:3])
            if len(skills) > 3:
                top_skills += f" +{len(skills) - 3}"
            skill_part = f" · <i>{top_skills}</i>"
        else:
            skill_part = ""

        lines.append(
            f"<b>{idx}. {title}</b>{badge}\n"
            f"   {company} · {location} ({work_type})\n"
            f"   <code>{salary}</code> · {emp_type}{skill_part}"
        )

    lines.append("")
    lines.append("<i>Tap a role below to inspect full details &amp; apply.</i>")
    return "\n".join(lines)


def build_main_keyboard():
    """Builds a clean persistent bottom reply keyboard for quick navigation."""
    markup = types.ReplyKeyboardMarkup(resize_keyboard=True, row_width=2)
    markup.row(
        types.KeyboardButton("📋 Browse Jobs"),
        types.KeyboardButton("🔍 Search Jobs"),
    )
    markup.row(
        types.KeyboardButton("🌐 Remote & Hybrid"),
        types.KeyboardButton("🎓 Internships"),
    )
    markup.row(types.KeyboardButton("💡 Guide & Tips"))
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


def build_details_buttons(job_id, back_callback=None, company_website=None):
    """Builds inline keyboard for the job detail view with Apply CTA, optional Website, and Back navigation."""
    web_url = get_web_url()
    apply_url = f"{web_url}/candidate/jobs/{job_id}"

    markup = types.InlineKeyboardMarkup(row_width=2)
    markup.add(types.InlineKeyboardButton("🚀 Apply on CareerLens", url=apply_url))

    valid_site = validate_http_url(company_website)
    if valid_site:
        markup.add(types.InlineKeyboardButton("🌐 Company Website", url=valid_site))

    if back_callback:
        markup.row(
            types.InlineKeyboardButton("← Back to Listings", callback_data=back_callback),
            types.InlineKeyboardButton("🔍 Search", callback_data="open_search"),
        )
    else:
        markup.row(
            types.InlineKeyboardButton("📋 Browse More Jobs", callback_data="list:all:0"),
            types.InlineKeyboardButton("🔍 Search", callback_data="open_search"),
        )
    return markup


def build_list_keyboard(jobs, filter_key="all", page=0, total_pages=1, query_hash=None):
    """Builds an interactive inline keyboard for paginated job browsing and filtering."""
    markup = types.InlineKeyboardMarkup()

    # 1. Quick filter pills (only in standard list mode)
    if query_hash is None:
        filter_row = []
        for key, spec in FILTER_SPECS.items():
            label = f"✓ {spec['pill']}" if key == filter_key else spec["pill"]
            filter_row.append(types.InlineKeyboardButton(label, callback_data=f"list:{key}:0"))
        markup.row(*filter_row)

    # 2. Job selection buttons (1 per row for clear mobile tapping)
    for idx, job in enumerate(jobs, start=1):
        company_name = job.company.company_name if job.company else "Company"
        btn_label = _truncate_label(f"{idx}. {job.title} — {company_name}", max_len=44)
        if query_hash is not None:
            cb = f"job:{job.id}:sq:{query_hash}:{page}"
        else:
            cb = f"job:{job.id}:{filter_key}:{page}"
        markup.row(types.InlineKeyboardButton(btn_label, callback_data=cb))

    # 3. Pagination row
    if total_pages > 1:
        nav_row = []
        base = f"sq:{query_hash}" if query_hash is not None else f"list:{filter_key}"
        if page > 0:
            nav_row.append(types.InlineKeyboardButton("◀ Prev", callback_data=f"{base}:{page - 1}"))
        nav_row.append(types.InlineKeyboardButton(f"{page + 1} / {total_pages}", callback_data="noop"))
        if page < total_pages - 1:
            nav_row.append(types.InlineKeyboardButton("Next ▶", callback_data=f"{base}:{page + 1}"))
        markup.row(*nav_row)

    # 4. Utility footer row
    web_url = get_web_url()
    footer_buttons = [
        types.InlineKeyboardButton("🔍 Search", callback_data="open_search"),
        types.InlineKeyboardButton("🌐 CareerLens Web", url=f"{web_url}/jobs"),
    ]
    if query_hash is not None:
        footer_buttons.insert(0, types.InlineKeyboardButton("📋 All Jobs", callback_data="list:all:0"))
    markup.row(*footer_buttons)

    return markup


def build_search_prompt_keyboard():
    """Builds inline quick-search preset chips."""
    markup = types.InlineKeyboardMarkup(row_width=3)
    buttons = [
        types.InlineKeyboardButton(f"🔎 {term}", callback_data=f"qs:{term}")
        for term in QUICK_SEARCH_PRESETS
    ]
    markup.add(*buttons)
    markup.row(types.InlineKeyboardButton("📋 Browse All Jobs", callback_data="list:all:0"))
    return markup


def encode_search_query(query):
    """Stores a search query in cache under a short deterministic hash (keeps callback_data <= 64 bytes)."""
    cleaned = (query or "").strip()
    digest = hashlib.md5(cleaned.encode("utf-8")).hexdigest()[:8]
    cache.set(f"tg_sq:{digest}", cleaned, timeout=SEARCH_CACHE_TTL)
    return digest


def decode_search_query(query_hash):
    """Retrieves a cached search query by short hash, returning None if expired."""
    if not query_hash:
        return None
    return cache.get(f"tg_sq:{query_hash}")


def send_typing_action(bot, chat_id):
    """Sends a typing indicator before database lookups without failing on network errors."""
    try:
        bot.send_chat_action(chat_id, "typing")
    except Exception:
        pass


def safe_answer_callback(bot, call_id, text=None, show_alert=False):
    """Answers a Telegram callback query safely so button spinners never hang."""
    try:
        bot.answer_callback_query(call_id, text=text, show_alert=show_alert)
    except Exception:
        pass


def _strip_html_to_plain(text):
    plain = re.sub(r"<[^>]+>", "", text)
    return html.unescape(plain)


def send_safe_message(
    bot,
    chat_id,
    text,
    reply_markup=None,
    parse_mode="HTML",
    disable_web_page_preview=True,
):
    """
    Safely sends a message to Telegram.
    Enforces Telegram's 4096-character limit without splitting open HTML tags,
    and falls back to plain text if HTML entity parsing fails.
    """
    if len(text) > MAX_MESSAGE_LENGTH:
        plain = _strip_html_to_plain(text)
        plain = plain[: MAX_MESSAGE_LENGTH - 3] + "..."
        return bot.send_message(
            chat_id,
            plain,
            reply_markup=reply_markup,
            disable_web_page_preview=disable_web_page_preview,
        )
    try:
        return bot.send_message(
            chat_id,
            text,
            reply_markup=reply_markup,
            parse_mode=parse_mode,
            disable_web_page_preview=disable_web_page_preview,
        )
    except Exception as exc:
        logger.warning(
            "Telegram send_message error with parse_mode=%s: %s. Falling back to plain text.",
            parse_mode,
            exc,
        )
        plain_text = _strip_html_to_plain(text)
        try:
            return bot.send_message(
                chat_id,
                plain_text,
                reply_markup=reply_markup,
                disable_web_page_preview=disable_web_page_preview,
            )
        except Exception as retry_exc:
            logger.warning(
                "Telegram send_message retry with markup failed: %s. Sending plain text without markup.",
                retry_exc,
            )
            return bot.send_message(
                chat_id,
                plain_text,
                reply_markup=None,
                disable_web_page_preview=disable_web_page_preview,
            )


def edit_or_send_message(
    bot,
    chat_id,
    message_id,
    text,
    reply_markup=None,
    parse_mode="HTML",
    disable_web_page_preview=True,
):
    """
    Edits an existing message in place for seamless SPA-like Telegram navigation,
    falling back gracefully to sending a new message if the message cannot be edited.
    """
    if message_id and len(text) <= MAX_MESSAGE_LENGTH:
        try:
            return bot.edit_message_text(
                text=text,
                chat_id=chat_id,
                message_id=message_id,
                reply_markup=reply_markup,
                parse_mode=parse_mode,
                disable_web_page_preview=disable_web_page_preview,
            )
        except Exception as exc:
            err_msg = str(exc).lower()
            if "message is not modified" in err_msg:
                return None
            logger.debug("edit_message_text fallback to send_safe_message: %s", exc)

    return send_safe_message(
        bot,
        chat_id,
        text,
        reply_markup=reply_markup,
        parse_mode=parse_mode,
        disable_web_page_preview=disable_web_page_preview,
    )


def sync_bot_commands(bot):
    """Registers the structured command menu with Telegram Bot API."""
    try:
        bot.set_my_commands(BOT_COMMANDS)
    except Exception as exc:
        logger.warning("Could not sync Telegram bot commands: %s", exc)


def _render_filtered_list(bot, chat_id, filter_key="all", page=0, message_id=None):
    """Fetches a page of jobs for a given filter and sends or edits the directory message."""
    spec = FILTER_SPECS.get(filter_key, FILTER_SPECS["all"])
    valid_key = filter_key if filter_key in FILTER_SPECS else "all"

    items, total_count, total_pages, safe_page = get_public_jobs_page(
        page=page,
        per_page=PAGE_SIZE,
        **spec["kwargs"],
    )

    if not items:
        empty_markup = types.InlineKeyboardMarkup(row_width=2)
        if valid_key != "all":
            empty_markup.add(
                types.InlineKeyboardButton("📋 View All Jobs", callback_data="list:all:0"),
                types.InlineKeyboardButton("🔍 Search", callback_data="open_search"),
            )
            empty_text = (
                f"ℹ️ <b>No {html.escape(spec['title'].lower())} right now.</b>\n\n"
                "Check all active listings or try searching by skill or location."
            )
        else:
            empty_markup.add(types.InlineKeyboardButton("🌐 Open CareerLens", url=f"{get_web_url()}/jobs"))
            empty_text = (
                "ℹ️ <b>No active job listings found at this time.</b>\n\n"
                "New openings are published regularly — check back soon or visit CareerLens."
            )
        edit_or_send_message(bot, chat_id, message_id, empty_text, reply_markup=empty_markup)
        return

    text = format_job_list_message(
        items,
        total_count=total_count,
        page=safe_page,
        total_pages=total_pages,
        heading=spec["title"],
    )
    markup = build_list_keyboard(
        items,
        filter_key=valid_key,
        page=safe_page,
        total_pages=total_pages,
    )
    edit_or_send_message(bot, chat_id, message_id, text, reply_markup=markup)


def _render_search_results(bot, chat_id, query, page=0, message_id=None):
    """Executes a job search and renders a single paginated results message."""
    cleaned = (query or "").strip()
    items, total_count, total_pages, safe_page = get_public_jobs_page(
        search=cleaned,
        page=page,
        per_page=PAGE_SIZE,
    )

    if not items:
        fallback_markup = build_search_prompt_keyboard()
        text = (
            f"❌ <b>No active jobs matched</b> <i>'{html.escape(cleaned)}'</i>.\n\n"
            "<blockquote><b>Try another search</b>\n"
            "• Tap a popular topic below\n"
            "• Use broader keywords like <code>React</code>, <code>Python</code>, or <code>Remote</code>\n"
            "• Search by city such as <code>Phnom Penh</code></blockquote>"
        )
        edit_or_send_message(bot, chat_id, message_id, text, reply_markup=fallback_markup)
        return

    q_hash = encode_search_query(cleaned)
    text = format_job_list_message(
        items,
        total_count=total_count,
        page=safe_page,
        total_pages=total_pages,
        heading=f"Results for '{cleaned}'",
    )
    markup = build_list_keyboard(
        items,
        page=safe_page,
        total_pages=total_pages,
        query_hash=q_hash,
    )
    edit_or_send_message(bot, chat_id, message_id, text, reply_markup=markup)


def _render_job_detail(bot, chat_id, job_id, back_callback=None, message_id=None):
    """Fetches and renders a single job's full detailed view."""
    job = get_public_job_by_id(job_id)
    if not job:
        markup = types.InlineKeyboardMarkup()
        markup.add(
            types.InlineKeyboardButton(
                "← Back to Listings" if back_callback else "📋 Browse Active Jobs",
                callback_data=back_callback or "list:all:0",
            )
        )
        text = (
            f"❌ <b>Job #{job_id} is no longer available</b>\n\n"
            "This position may have closed or passed its application deadline."
        )
        edit_or_send_message(bot, chat_id, message_id, text, reply_markup=markup)
        return

    text = format_job_details(job)
    company_site = job.company.website if job.company else None
    markup = build_details_buttons(
        job.id,
        back_callback=back_callback,
        company_website=company_site,
    )
    edit_or_send_message(bot, chat_id, message_id, text, reply_markup=markup)


def register_handlers(bot):
    """Registers all command, callback, natural-language, and fallback handlers."""

    @bot.message_handler(commands=["start"])
    def handle_start(message):
        first_name = html.escape(getattr(message.from_user, "first_name", None) or "there")
        welcome_text = (
            f"👋 <b>Hi {first_name}, Welcome to CareerLens Bot!</b>\n\n"
            "Discover verified tech jobs, internships, and remote opportunities — fast and distraction-free.\n\n"
            "<blockquote><b>What you can do here</b>\n"
            "• <b>📋 Browse Jobs</b> — Interactive listings with instant filters\n"
            "• <b>🔍 Smart Search</b> — Type any skill, role, company, or city\n"
            "• <b>🌐 Remote &amp; Internships</b> — One-tap curated feeds\n"
            "• <b>#ID Lookup</b> — Send <code>/job 12</code> or <code>#12</code> for direct details</blockquote>\n\n"
            "<i>No login required to explore. Tap <b>Apply on CareerLens</b> on any listing to submit your application.</i>"
        )
        send_safe_message(
            bot,
            message.chat.id,
            welcome_text,
            reply_markup=build_main_keyboard(),
        )

    @bot.message_handler(commands=["help"])
    def handle_help(message):
        help_text = (
            "📖 <b>CareerLens Bot · Guide &amp; Commands</b>\n\n"
            "<blockquote><b>Slash Commands</b>\n"
            "• <code>/jobs</code> — Browse all active published jobs\n"
            "• <code>/remote</code> — View remote &amp; hybrid roles\n"
            "• <code>/internships</code> — View internship openings\n"
            "• <code>/search &lt;keyword&gt;</code> — Search by role, skill, company, or city\n"
            "• <code>/job &lt;id&gt;</code> — Open full details for a specific job ID</blockquote>\n\n"
            "<b>Natural Search</b>\n"
            "Simply type any keyword directly into chat — no slash needed:\n"
            "• <code>React</code> · <code>Python Django</code> · <code>Phnom Penh</code> · <code>#12</code>\n\n"
            "<b>Trust &amp; Verification</b>\n"
            "Companies marked with <b>✓</b> have been verified by CareerLens administrators. "
            "Tapping <b>🚀 Apply on CareerLens</b> takes you directly to the official application page."
        )
        send_safe_message(
            bot,
            message.chat.id,
            help_text,
            reply_markup=build_main_keyboard(),
        )

    @bot.message_handler(commands=["jobs"])
    def handle_jobs(message):
        send_typing_action(bot, message.chat.id)
        _render_filtered_list(bot, message.chat.id, filter_key="all", page=0)

    @bot.message_handler(commands=["remote"])
    def handle_remote(message):
        send_typing_action(bot, message.chat.id)
        _render_filtered_list(bot, message.chat.id, filter_key="remote", page=0)

    @bot.message_handler(commands=["internships", "intern"])
    def handle_internships(message):
        send_typing_action(bot, message.chat.id)
        _render_filtered_list(bot, message.chat.id, filter_key="intern", page=0)

    @bot.message_handler(commands=["search"])
    def handle_search(message):
        parts = (message.text or "").split(maxsplit=1)
        if len(parts) < 2 or not parts[1].strip():
            prompt = (
                "🔍 <b>Please provide a search keyword.</b>\n\n"
                "<blockquote><b>Usage:</b> <code>/search &lt;keyword&gt;</code>\n"
                "<b>Examples:</b> <code>/search React</code> · <code>/search Phnom Penh</code></blockquote>\n\n"
                "Or tap a popular topic below:"
            )
            send_safe_message(
                bot,
                message.chat.id,
                prompt,
                reply_markup=build_search_prompt_keyboard(),
            )
            return

        send_typing_action(bot, message.chat.id)
        _render_search_results(bot, message.chat.id, query=parts[1].strip(), page=0)

    @bot.message_handler(commands=["job"])
    def handle_job_detail_command(message):
        parts = (message.text or "").split()
        if len(parts) < 2 or not parts[1].lstrip("#").isdigit():
            send_safe_message(
                bot,
                message.chat.id,
                "⚠️ <b>Please specify a numeric job ID.</b>\n\n"
                "<i>Example:</i> <code>/job 5</code> or simply type <code>#5</code>.",
            )
            return

        job_id = int(parts[1].lstrip("#"))
        send_typing_action(bot, message.chat.id)
        _render_job_detail(bot, message.chat.id, job_id)

    @bot.callback_query_handler(func=lambda call: True)
    def handle_callbacks(call):
        data = call.data or ""
        chat_id = call.message.chat.id
        message_id = call.message.message_id

        try:
            if data == "noop":
                safe_answer_callback(bot, call.id)
                return

            if data == "open_search":
                safe_answer_callback(bot, call.id)
                prompt = (
                    "🔍 <b>Search CareerLens Jobs</b>\n\n"
                    "Type any skill, job title, company, or city directly in chat — "
                    "or pick a popular search below:"
                )
                edit_or_send_message(
                    bot,
                    chat_id,
                    message_id,
                    prompt,
                    reply_markup=build_search_prompt_keyboard(),
                )
                return

            if data in ("browse_jobs", "filter_all"):
                safe_answer_callback(bot, call.id)
                _render_filtered_list(bot, chat_id, filter_key="all", page=0, message_id=message_id)
                return

            if data == "filter_remote":
                safe_answer_callback(bot, call.id)
                _render_filtered_list(bot, chat_id, filter_key="remote", page=0, message_id=message_id)
                return

            if data.startswith("list:"):
                parts = data.split(":")
                filter_key = parts[1] if len(parts) > 1 else "all"
                try:
                    page = int(parts[2]) if len(parts) > 2 else 0
                except ValueError:
                    page = 0
                safe_answer_callback(bot, call.id)
                _render_filtered_list(bot, chat_id, filter_key=filter_key, page=page, message_id=message_id)
                return

            if data.startswith("qs:"):
                preset_query = data[3:].strip()
                safe_answer_callback(bot, call.id, f"Searching {preset_query}…")
                _render_search_results(bot, chat_id, query=preset_query, page=0, message_id=message_id)
                return

            if data.startswith("sq:"):
                parts = data.split(":")
                q_hash = parts[1] if len(parts) > 1 else ""
                try:
                    page = int(parts[2]) if len(parts) > 2 else 0
                except ValueError:
                    page = 0
                query = decode_search_query(q_hash)
                if not query:
                    safe_answer_callback(bot, call.id, "Search session expired. Please search again.")
                    edit_or_send_message(
                        bot,
                        chat_id,
                        message_id,
                        "⏱ <b>This search session expired.</b>\n\nType your keyword again or tap a topic below:",
                        reply_markup=build_search_prompt_keyboard(),
                    )
                    return
                safe_answer_callback(bot, call.id)
                _render_search_results(bot, chat_id, query=query, page=page, message_id=message_id)
                return

            if data.startswith("job:"):
                parts = data.split(":")
                try:
                    job_id = int(parts[1])
                except (IndexError, ValueError):
                    safe_answer_callback(bot, call.id, "Invalid job selection.")
                    return

                back_cb = None
                if len(parts) >= 5 and parts[2] == "sq":
                    back_cb = f"sq:{parts[3]}:{parts[4]}"
                elif len(parts) >= 4:
                    back_cb = f"list:{parts[2]}:{parts[3]}"

                safe_answer_callback(bot, call.id)
                _render_job_detail(bot, chat_id, job_id, back_callback=back_cb, message_id=message_id)
                return

            if data.startswith("job_"):
                try:
                    job_id = int(data.split("_")[1])
                except (IndexError, ValueError):
                    safe_answer_callback(bot, call.id, "Invalid job selection.")
                    return
                safe_answer_callback(bot, call.id)
                _render_job_detail(bot, chat_id, job_id, message_id=message_id)
                return

            safe_answer_callback(bot, call.id, "Action unavailable.")
        except Exception as exc:
            logger.exception("Error in callback handler: %s", exc)
            safe_answer_callback(bot, call.id, "Something went wrong. Please try again.")

    @bot.message_handler(func=lambda msg: True, content_types=["text"])
    def handle_natural_text(message):
        raw_text = (message.text or "").strip()
        if not raw_text:
            return

        # Unknown slash commands get a helpful response instead of silence
        if raw_text.startswith("/"):
            cmd = html.escape(raw_text.split()[0])
            send_safe_message(
                bot,
                message.chat.id,
                f"❓ Unknown command <code>{cmd}</code>.\n\n"
                "Try /jobs, /remote, /internships, /search &lt;keyword&gt;, or /help.",
                reply_markup=build_main_keyboard(),
            )
            return

        lower = raw_text.lower()

        # 1. Quick Menu Buttons & Aliases
        if lower in {"📋 browse jobs", "📋 latest jobs", "jobs", "browse", "list", "show jobs"}:
            return handle_jobs(message)

        if lower in {"🌐 remote & hybrid", "🌐 remote jobs", "remote", "remote jobs", "hybrid"}:
            return handle_remote(message)

        if lower in {"🎓 internships", "internships", "intern", "internship"}:
            return handle_internships(message)

        if lower in {"🔍 search jobs", "search"}:
            prompt = (
                "🔍 <b>What role or skill are you looking for?</b>\n\n"
                "Type any keyword directly into chat (e.g. <code>React</code>, <code>Python</code>, "
                "<code>Phnom Penh</code>) — or tap a popular topic below:"
            )
            send_safe_message(
                bot,
                message.chat.id,
                prompt,
                reply_markup=build_search_prompt_keyboard(),
            )
            return

        if lower in {"💡 guide & tips", "💡 help & guide", "help", "guide", "info"}:
            return handle_help(message)

        # 2. Greetings & Polite Closings
        if lower in {"hi", "hello", "hey", "hola", "greetings", "good morning", "good evening", "start"}:
            return handle_start(message)

        if lower in {"thanks", "thank you", "thx", "ty"}:
            send_safe_message(
                bot,
                message.chat.id,
                "You're welcome! 😊 Let me know anytime you want to explore new jobs or search by skill.",
                reply_markup=build_main_keyboard(),
            )
            return

        # 3. Numeric Job ID lookup (e.g. "12", "#12", "job 12", "job #12")
        numeric_match = re.match(r"^(?:#|job\s*#?)(\d+)$", lower)
        if numeric_match:
            job_id = int(numeric_match.group(1))
            send_typing_action(bot, message.chat.id)
            _render_job_detail(bot, message.chat.id, job_id)
            return

        # 4. Career Advice & Platform Guidance
        if any(term in lower for term in ("interview", "resume", "cv", "tips", "career", "advice", "roadmap")):
            web_url = get_web_url()
            advice_markup = types.InlineKeyboardMarkup()
            advice_markup.add(
                types.InlineKeyboardButton("✨ Open CareerLens Studio", url=web_url),
                types.InlineKeyboardButton("📋 Browse Jobs", callback_data="list:all:0"),
            )
            advice = (
                "🎯 <b>CareerLens AI Career Tools</b>\n\n"
                "<blockquote>• <b>AI CV Studio:</b> Instant ATS scoring, gap diagnosis, and tailored revisions.\n"
                "• <b>AI Interview Coach:</b> Role-specific questions &amp; STAR prep when shortlisted.\n"
                "• <b>Career Roadmap:</b> Step-by-step skill milestones for your target tech role.</blockquote>\n\n"
                f"👉 Explore all tools on <a href=\"{web_url}\">CareerLens Web App</a>"
            )
            send_safe_message(bot, message.chat.id, advice, reply_markup=advice_markup)
            return

        # 5. Smart Search by default for any free text
        send_typing_action(bot, message.chat.id)
        _render_search_results(bot, message.chat.id, query=raw_text, page=0)

    @bot.message_handler(
        func=lambda msg: True,
        content_types=["photo", "sticker", "voice", "audio", "video", "document", "location", "contact"],
    )
    def handle_non_text(message):
        send_safe_message(
            bot,
            message.chat.id,
            "💬 I work best with text messages and menu buttons!\n\n"
            "Tap <b>📋 Browse Jobs</b> below or type a skill like <code>React</code> or <code>Python</code> to search.",
            reply_markup=build_main_keyboard(),
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
