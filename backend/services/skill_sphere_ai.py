"""
Skill Sphere — Gemini-powered career intelligence (ported concepts from SkillSphere).

Single module used by /api/skill-sphere/* for persona, coach, trends, portfolio, etc.
"""

from __future__ import annotations

from google.genai.types import GenerateContentConfig

from config import settings
from services.skill_extractor import _get_client, _parse_json_from_response


def _require_gemini():
    if not settings.GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY not configured")


def _generate_json(prompt: str, max_tokens: int = 8192) -> dict:
    _require_gemini()
    client = _get_client()
    response = client.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=prompt,
        config=GenerateContentConfig(
            temperature=0.35,
            max_output_tokens=max_tokens,
            response_mime_type="application/json",
        ),
    )
    return _parse_json_from_response(response.text)


def generate_career_persona(
    resume_text: str,
    jd_text: str,
    resume_skills: list[str],
    gap_skills: list[str],
) -> dict:
    skills = ", ".join(resume_skills[:40]) or "(none provided)"
    gaps = ", ".join(gap_skills[:25]) or "(none listed)"
    resume = (resume_text or "")[:8000]
    jd = (jd_text or "")[:4000]
    prompt = f"""You are an executive career coach. Build a structured professional persona from this data.

Return ONLY JSON with keys:
- headline: string, one line value proposition
- strengths: array of 4-6 strings
- weaknesses_or_growth_areas: array of 3-5 strings (constructive, professional)
- unique_value_proposition: string, 2-3 sentences
- suggested_roles: array of 3-5 job titles that fit
- narrative: string, short third-person bio (4-6 sentences)

RESUME_TEXT:
{resume}

TARGET_JOB_DESCRIPTION:
{jd}

RESUME_SKILLS: {skills}
IDENTIFIED_GAPS: {gaps}
"""
    return _generate_json(prompt)


def career_coach_reply(
    messages: list[dict],
    resume_text: str,
    jd_text: str,
    resume_skills: list[str],
    gap_skills: list[str],
) -> dict:
    history = "\n".join(
        f"{m.get('role', 'user').upper()}: {m.get('content', '')[:2000]}"
        for m in messages[-12:]
    )
    resume = (resume_text or "")[:4000]
    jd = (jd_text or "")[:2000]
    skills = ", ".join(resume_skills[:35])
    gaps = ", ".join(gap_skills[:20])
    prompt = f"""You are a supportive AI career coach. Reply to the latest user message with actionable advice.

Context — resume excerpt: {resume}
Context — job target excerpt: {jd}
Skills: {skills}
Gaps: {gaps}

Conversation:
{history}

Return ONLY JSON: {{"reply": "markdown string with short headings if helpful", "suggested_actions": ["...", "..."]}}
"""
    return _generate_json(prompt, max_tokens=4096)


def job_match_score(job_title: str, company: str, job_description: str, resume_skills: list[str]) -> dict:
    jd = (job_description or "")[:3500]
    skills = ", ".join(resume_skills[:40])
    prompt = f"""Score how well a candidate fits this job based on skills overlap and JD.

Job: {job_title} at {company}
JD: {jd}
Candidate skills: {skills}

Return ONLY JSON:
{{
  "match_score": number 0-100,
  "summary": "2-3 sentences",
  "strengths_for_role": ["..."],
  "gaps_for_role": ["..."],
  "interview_focus": ["..."]
}}
"""
    return _generate_json(prompt)


def peer_learning_suggestions(target_role: str, resume_skills: list[str], gap_skills: list[str]) -> dict:
    skills = ", ".join(resume_skills[:30])
    gaps = ", ".join(gap_skills[:20])
    prompt = f"""Suggest peer learning activities for someone targeting: {target_role}

Their skills: {skills}
Their gaps: {gaps}

Return ONLY JSON:
{{
  "study_group_themes": ["...", "..."],
  "resource_swap_ideas": ["...", "..."],
  "accountability_rhythm": "string, weekly plan suggestion",
  "discussion_prompts": ["...", "..."],
  "mock_peer_profiles": [{{"archetype": "string", "focus": "string", "how_to_find": "string"}}]
}}
"""
    return _generate_json(prompt)


def personalized_learning_path(gap_skills: list[str], domain: str, resume_skills: list[str]) -> dict:
    gaps = ", ".join(gap_skills[:25])
    skills = ", ".join(resume_skills[:25])
    prompt = f"""Create a concise learning path to close skill gaps.

Domain: {domain}
Current skills: {skills}
Priority gaps: {gaps}

Return ONLY JSON:
{{
  "path_title": "string",
  "weeks_estimate": number,
  "phases": [{{"name": "string", "focus_skills": ["..."], "milestones": ["..."], "resources_hint": ["platform or type e.g. YouTube course, docs"]}}],
  "weekly_commitment_hours": number
}}
"""
    return _generate_json(prompt)


def interview_performance_report(problem_statement: str, code: str, language: str) -> dict:
    code = (code or "")[:12000]
    prob = (problem_statement or "")[:2000]
    prompt = f"""You are a senior hiring manager reviewing a coding interview submission.

Problem: {prob}
Language: {language}
Code:
```
{code}
```

Return ONLY JSON:
{{
  "overall_score": number 0-100,
  "code_quality": "paragraph",
  "efficiency": "paragraph",
  "correctness_risks": ["..."],
  "communication_tips": ["..."],
  "next_practice_topics": ["..."]
}}
"""
    return _generate_json(prompt, max_tokens=4096)


def job_market_trends(profile_role_hint: str, resume_skills: list[str], location_hint: str = "") -> dict:
    skills = ", ".join(resume_skills[:25])
    prompt = f"""Infer plausible job-market trends tailored to this profile (general knowledge, not live web data).

Target role hint: {profile_role_hint}
Skills: {skills}
Location hint: {location_hint or "remote/global"}

Return ONLY JSON:
{{
  "trending_roles": [{{"title": "string", "growth_signal": "string", "salary_band_usd": "string e.g. 120k-180k"}}],
  "industries": [{{"name": "string", "why_hot": "string"}}],
  "skills_in_demand": ["..."],
  "salary_insight": "2-3 sentences",
  "chart_friendly": [{{"label": "string", "value": number 0-100, "category": "roles|industries|skills"}}]
}}
"""
    return _generate_json(prompt)


def suggest_roles_for_current_skills(
    resume_skills: list[str],
    skills_still_needed: list[str],
    experience_level: str,
    jd_text_snippet: str,
    match_percentage: float,
) -> dict:
    """
    Given current stack + gaps vs a target JD, suggest roles that fit *today*
    vs roles that open up after closing the gap.
    """
    skills = ", ".join(resume_skills[:45]) or "(none listed)"
    gaps = ", ".join(skills_still_needed[:30]) or "(none listed)"
    jd = (jd_text_snippet or "")[:4000]
    prompt = f"""You are a talent advisor. The user analyzed their resume against a TARGET job description.

Their experience band: {experience_level}
JD alignment score (resume vs this JD): {match_percentage}%

Skills observed on resume: {skills}
Skills still missing for THAT target role: {gaps}

Target JD excerpt (for role title / seniority context only):
{jd}

Return ONLY valid JSON:
{{
  "one_line_summary": "string — candid, encouraging",
  "coverage_vs_target": "string — 2 sentences on what they already have vs what the target role still needs",
  "realistic_roles_now": [
    {{"title": "string", "fit_score": 0-100, "rationale": "1-2 sentences, grounded in listed skills"}}
  ],
  "stretch_after_roadmap": [
    {{"title": "string", "why": "how closing the listed gaps unlocks this"}}
  ],
  "skill_gap_priority": ["top 5 gap skills to close first, short phrases"]
}}

Rules:
- realistic_roles_now: 4-6 job titles someone with THESE resume skills could reasonably interview for today (may be different from the pasted JD title).
- stretch_after_roadmap: 3-4 roles that match the TARGET JD or seniority once gaps are closed.
- fit_score: honest relative fit for that suggested title given current skills only.
"""
    return _generate_json(prompt, max_tokens=4096)


def _strip_markdown_fence(text: str) -> str:
    t = text.strip()
    if t.startswith("```html"):
        t = t[7:]
    elif t.startswith("```"):
        t = t[3:]
    if t.endswith("```"):
        t = t[:-3]
    return t.strip()


def portfolio_site_html(resume_text: str, name_hint: str = "Professional") -> dict:
    """
    Emit raw HTML (not JSON-wrapped): large pages break JSON parsers and trigger wrong fallbacks.
    """
    resume = (resume_text or "")[:6000]
    _require_gemini()
    client = _get_client()
    prompt = f"""Generate a single-page portfolio website as raw HTML only (no JSON, no markdown explanation).

Candidate name to display: {name_hint}

Use the resume to fill: Hero, About, Skills (as tags or list), Experience timeline, Education if present, Contact CTA.

Rules:
- First line of your entire response MUST be <!DOCTYPE html>
- Embedded <style> in <head> only; dark theme, accent color #a855f7, responsive
- No external scripts or CSS URLs
- Semantic HTML5, professional and minimal

Resume:
{resume}
"""
    response = client.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=prompt,
        config=GenerateContentConfig(
            temperature=0.25,
            max_output_tokens=8192,
        ),
    )
    html = _strip_markdown_fence(response.text or "")
    low = html.lower()
    if "<!doctype html" in low[:200] or html.strip().lower().startswith("<html"):
        return {
            "html": html,
            "meta_description": f"{name_hint} — professional portfolio",
        }
    # Rare fallback: short JSON wrapper if model ignored instructions
    try:
        data = _parse_json_from_response(response.text or "{}")
        if isinstance(data, dict) and data.get("html"):
            return data
    except Exception:
        pass
    return {
        "html": f'<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>{name_hint}</title></head><body><p>Could not generate portfolio HTML. Try again or shorten the resume.</p></body></html>',
        "meta_description": "generation failed",
    }
