import json
import logging
import requests

logger = logging.getLogger(__name__)

GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"
DEFAULT_GEMINI_MODEL = "gemini-2.5-flash"


def validate_gemini_key(api_key):
    """
    Validates a Gemini API key with a minimal test request.
    Returns (is_valid: bool, message: str).
    """
    if not api_key or not isinstance(api_key, str) or len(api_key.strip()) < 10:
        return False, "API key format is invalid."

    clean_key = api_key.strip()
    url = f"{GEMINI_API_BASE_URL}/{DEFAULT_GEMINI_MODEL}:generateContent?key={clean_key}"
    payload = {
        "contents": [
            {"parts": [{"text": "Respond with OK."}]}
        ],
        "generationConfig": {
            "maxOutputTokens": 10,
        },
    }

    try:
        resp = requests.post(url, json=payload, timeout=10)
        if resp.status_code == 200:
            return True, "Key is valid and active."
        data = resp.json()
        err_msg = data.get("error", {}).get("message", "API key authentication failed.")
        return False, err_msg
    except Exception as e:
        logger.warning("Gemini key validation error: %s", e)
        return False, f"Could not connect to Gemini API: {str(e)}"


def call_gemini_api(prompt, api_key, system_instruction=None, response_json=True):
    """
    Sends a structured prompt to Gemini and parses the response.
    Returns (success: bool, result_data: dict | str).
    """
    if not api_key:
        return False, None

    clean_key = api_key.strip()
    url = f"{GEMINI_API_BASE_URL}/{DEFAULT_GEMINI_MODEL}:generateContent?key={clean_key}"

    payload = {
        "contents": [
            {"parts": [{"text": prompt}]}
        ],
        "generationConfig": {
            "temperature": 0.4,
        },
    }

    if response_json:
        payload["generationConfig"]["responseMimeType"] = "application/json"

    if system_instruction:
        payload["systemInstruction"] = {
            "parts": [{"text": system_instruction}]
        }

    try:
        resp = requests.post(url, json=payload, timeout=25)
        if resp.status_code != 200:
            logger.error("Gemini API call failed with status %s: %s", resp.status_code, resp.text)
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
                # Strip markdown json codeblocks if returned
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
        logger.warning("Gemini API request exception: %s", e)
        return False, None


def gemini_analyze_cv(parsed_data, target_role, api_key):
    """
    Calls Google Gemini to provide a real ATS quality evaluation and 10.0 score.
    """
    system_inst = (
        "You are an expert Technical Recruiter and ATS CV Evaluator. "
        "Analyze the provided candidate CV details against the target role. "
        "Return strict JSON with keys: overall_score (float between 1.0 and 10.0), "
        "quality_tier ('Top Competitive' | 'Strong Candidate' | 'Solid Foundation' | 'Needs Enhancement'), "
        "section_scores (object with floats 1.0-10.0 for contact, summary, skills, experience, education, projects), "
        "strengths (array of strings), weaknesses (array of strings), "
        "recommendations (array of actionable strings)."
    )

    prompt = (
        f"Target Role: {target_role or 'General Software Developer'}\n"
        f"Candidate CV Data:\n{json.dumps(parsed_data, indent=2)}\n\n"
        "Evaluate this CV objectively and return the requested JSON."
    )

    ok, result = call_gemini_api(prompt, api_key, system_instruction=system_inst, response_json=True)
    if ok and isinstance(result, dict) and "overall_score" in result:
        return result
    return None


def gemini_improve_cv(current_content, target_role, answers, selected_improvements, api_key):
    """
    Calls Google Gemini to rewrite CV sections, quantify impact, and enhance bullet points.
    """
    system_inst = (
        "You are an executive CV Writer and ATS Optimization Specialist. "
        "Rewrite and enhance the provided candidate CV. Convert passive descriptions into decisive "
        "action verbs with quantifiable metrics. Write a compelling professional summary. "
        "Return strict JSON with two keys: 'improved_content' (the complete enhanced CV matching the input structure) "
        "and 'reanalysis' (object with overall_score, quality_tier, section_scores, strengths, weaknesses, recommendations)."
    )

    prompt = (
        f"Target Role: {target_role or 'Software Engineer'}\n"
        f"Selected Improvements: {json.dumps(selected_improvements)}\n"
        f"Candidate Answers to Gaps:\n{json.dumps(answers, indent=2)}\n\n"
        f"Current CV Content:\n{json.dumps(current_content, indent=2)}\n\n"
        "Generate the enhanced CV and reanalysis in JSON."
    )

    ok, result = call_gemini_api(prompt, api_key, system_instruction=system_inst, response_json=True)
    if ok and isinstance(result, dict) and "improved_content" in result:
        return result.get("improved_content"), result.get("reanalysis")
    return None, None


def gemini_generate_roadmap(target_role, weekly_hours, known_skills, job_details, api_key):
    """
    Calls Google Gemini to generate a tailored 5-stage progressive learning roadmap.
    """
    system_inst = (
        "You are a Senior Engineering Mentor. Generate a progressive, 5-stage learning roadmap "
        "for a student targeting this role. "
        "Return strict JSON with keys: "
        "missing_skills (array of {name, priority, category, status='gap'}), "
        "additional_recommendations (array of strings), "
        "stages (array of 5 objects with id, stage_number, title, description, estimated_weeks, "
        "milestones: array of {id, title, description, status='not_started', deliverables, resources: array of {name, url, description}, notes: ''}))."
    )

    prompt = (
        f"Target Role: {target_role}\n"
        f"Weekly Study Hours: {weekly_hours} hrs/week\n"
        f"Known Skills: {', '.join(known_skills)}\n"
        f"Target Job Context: {json.dumps(job_details) if job_details else 'None'}\n\n"
        "Generate the staged learning roadmap in JSON."
    )

    ok, result = call_gemini_api(prompt, api_key, system_instruction=system_inst, response_json=True)
    if ok and isinstance(result, dict) and "stages" in result and len(result["stages"]) == 5:
        return result
    return None

