import json
import logging
import requests

from .prompts import (
    RESUME_ANALYZER_SYSTEM_INSTRUCTION,
    build_resume_analysis_prompt,
    CV_DIAGNOSIS_SYSTEM_INSTRUCTION,
    build_cv_diagnosis_prompt,
    CV_IMPROVEMENT_SYSTEM_INSTRUCTION,
    build_cv_improvement_prompt,
    CAREER_ROADMAP_SYSTEM_INSTRUCTION,
    build_career_roadmap_prompt,
    JOB_RECOMMENDATION_SYSTEM_INSTRUCTION,
    build_job_recommendation_prompt,
)

logger = logging.getLogger(__name__)

GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"
DEFAULT_GEMINI_MODEL = "gemini-3.5-flash-lite"
SUPPORTED_GEMINI_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-3.8-flash",
    "gemini-2.5-flash-lite",
]


def validate_gemini_key(api_key):
    """
    Validates a Gemini API key with a minimal test request.
    Uses gemini-3.5-flash-lite as primary with automatic fallback to supported flash models.
    Returns (is_valid: bool, message: str).
    """
    if not api_key or not isinstance(api_key, str) or len(api_key.strip()) < 10:
        return False, "API key format is invalid."

    clean_key = api_key.strip()
    payload = {
        "contents": [
            {"parts": [{"text": "Respond with OK."}]}
        ],
        "generationConfig": {
            "maxOutputTokens": 10,
        },
    }

    last_error = ""
    for model_name in SUPPORTED_GEMINI_MODELS:
        url = f"{GEMINI_API_BASE_URL}/{model_name}:generateContent?key={clean_key}"
        try:
            resp = requests.post(url, json=payload, timeout=10)
            if resp.status_code == 200:
                return True, f"Key is valid and active with {model_name}."
            data = resp.json()
            last_error = data.get("error", {}).get("message", "API key authentication failed.")
            # If model is unavailable or not found, try next model in fallback list
            if resp.status_code != 404 and "not found" not in last_error.lower() and "no longer available" not in last_error.lower():
                return False, last_error
        except Exception as e:
            logger.warning("Gemini key validation error with %s: %s", model_name, e)
            last_error = f"Could not connect to Gemini API: {str(e)}"

    return False, last_error


def call_gemini_api(prompt, api_key, system_instruction=None, response_json=True):
    """
    Sends a structured prompt to Gemini with system instructions and JSON mode.
    Tries gemini-3.5-flash-lite with fallback to gemini-3.8-flash.
    Returns (success: bool, result_data: dict | str).
    """
    if not api_key:
        return False, None

    clean_key = api_key.strip()
    payload = {
        "contents": [
            {"parts": [{"text": prompt}]}
        ],
        "generationConfig": {
            "temperature": 0.35,
        },
    }

    if response_json:
        payload["generationConfig"]["responseMimeType"] = "application/json"

    if system_instruction:
        payload["systemInstruction"] = {
            "parts": [{"text": system_instruction}]
        }

    for model_name in SUPPORTED_GEMINI_MODELS:
        url = f"{GEMINI_API_BASE_URL}/{model_name}:generateContent?key={clean_key}"
        try:
            resp = requests.post(url, json=payload, timeout=30)
            if resp.status_code != 200:
                err_text = resp.text
                logger.warning("Gemini API call with %s failed (status %s): %s", model_name, resp.status_code, err_text)
                if resp.status_code == 404 or "not found" in err_text.lower() or "no longer available" in err_text.lower():
                    continue
                return False, None

            data = resp.json()
            candidates = data.get("candidates", [])
            if not candidates:
                return False, None

            parts = candidates[0].get("content", {}).get("parts", [])
            if not parts:
                return False, None

            raw_text = parts[0].get("text", "").strip()
            if response_json:
                try:
                    if raw_text.startswith("```json"):
                        raw_text = raw_text[7:]
                    if raw_text.endswith("```"):
                        raw_text = raw_text[:-3]
                    parsed = json.loads(raw_text.strip())
                    return True, parsed
                except Exception as json_err:
                    logger.warning("Failed to parse Gemini JSON output: %s. Raw: %s", json_err, raw_text)
                    return False, None

            return True, raw_text
        except Exception as e:
            logger.warning("Gemini API request exception with %s: %s", model_name, e)
            continue

    return False, None


# ============================================================================
# 1. AI Resume Quality Analyzer
# ============================================================================

def gemini_analyze_cv(parsed_data, target_role, api_key):
    """
    Evaluates CV across 6 ATS criteria using Prompt 1.
    """
    prompt = build_resume_analysis_prompt(parsed_data, target_role)
    ok, result = call_gemini_api(
        prompt=prompt,
        api_key=api_key,
        system_instruction=RESUME_ANALYZER_SYSTEM_INSTRUCTION,
        response_json=True,
    )
    if ok and isinstance(result, dict) and "overall_score" in result:
        return result
    return None


# ============================================================================
# 2. AI CV Gap Diagnosis & Questionnaire
# ============================================================================

def gemini_diagnose_cv(parsed_data, target_role, api_key):
    """
    Produces tailored weakness diagnosis and 3 questions using Prompt 2.
    """
    prompt = build_cv_diagnosis_prompt(parsed_data, target_role)
    ok, result = call_gemini_api(
        prompt=prompt,
        api_key=api_key,
        system_instruction=CV_DIAGNOSIS_SYSTEM_INSTRUCTION,
        response_json=True,
    )
    if ok and isinstance(result, dict) and "questions" in result:
        return result
    return None


# ============================================================================
# 3. AI CV Improvement Studio - Full CV Enhancement
# ============================================================================

def gemini_improve_cv(current_content, target_role, answers, selected_improvements, api_key, template="modern"):
    """
    Rewrites CV using Google's X-Y-Z formula and action verbs using Prompt 3.
    """
    prompt = build_cv_improvement_prompt(current_content, target_role, answers, selected_improvements, template)
    ok, result = call_gemini_api(
        prompt=prompt,
        api_key=api_key,
        system_instruction=CV_IMPROVEMENT_SYSTEM_INSTRUCTION,
        response_json=True,
    )
    if ok and isinstance(result, dict) and "improved_content" in result:
        return result.get("improved_content"), result.get("reanalysis")
    return None, None


# ============================================================================
# 4. AI Career Roadmap Generator
# ============================================================================

def gemini_generate_roadmap(target_role, weekly_hours, known_skills, job_details, api_key):
    """
    Builds a personalized 5-stage learning roadmap scaled to weekly hours using Prompt 4.
    """
    prompt = build_career_roadmap_prompt(target_role, weekly_hours, known_skills, job_details)
    ok, result = call_gemini_api(
        prompt=prompt,
        api_key=api_key,
        system_instruction=CAREER_ROADMAP_SYSTEM_INSTRUCTION,
        response_json=True,
    )
    if ok and isinstance(result, dict) and "stages" in result and len(result["stages"]) == 5:
        return result
    return None


# ============================================================================
# 5. AI Best-Fit Jobs Match Engine
# ============================================================================

def gemini_recommend_job(job_data, candidate_data, preferences, api_key):
    """
    Evaluates fit percentage and generates tailored justification using Prompt 5.
    """
    prompt = build_job_recommendation_prompt(job_data, candidate_data, preferences)
    ok, result = call_gemini_api(
        prompt=prompt,
        api_key=api_key,
        system_instruction=JOB_RECOMMENDATION_SYSTEM_INSTRUCTION,
        response_json=True,
    )
    if ok and isinstance(result, dict) and "match_score" in result:
        return result
    return None
