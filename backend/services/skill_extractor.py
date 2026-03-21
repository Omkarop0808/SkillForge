"""
Skill Extractor Service — LLM-based skill extraction using Gemini.

Extracts structured skill data from resume and JD text using Google Gemini API.
Uses structured JSON output for reliable parsing.
"""

import json
import re
from google import genai
from google.genai.types import GenerateContentConfig

from config import settings

# Initialize Gemini client
_client = None


def _get_client():
    """Get or create Gemini client singleton."""
    global _client
    if _client is None:
        if not settings.GEMINI_API_KEY:
            raise RuntimeError("GEMINI_API_KEY not configured in .env")
        _client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _client


def _fix_json_string(text: str) -> str:
    """Fix common JSON issues from LLM output."""
    # Remove trailing commas before } or ]
    text = re.sub(r',\s*([}\]])', r'\1', text)
    # Remove single-line comments
    text = re.sub(r'//.*?$', '', text, flags=re.MULTILINE)
    # Remove newlines inside strings (common LLM mistake)
    text = text.replace('\r\n', ' ').replace('\r', ' ')
    return text


def _parse_json_from_response(text: str) -> dict:
    """Extract JSON from LLM response with multiple fallback strategies."""
    
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()

    # Strategy 1: Direct parse
    try:
        return json.loads(text)
    except (json.JSONDecodeError, ValueError):
        pass
    
    # Strategy 2: Extract from markdown code blocks
    code_block = re.search(r'```(?:json)?\s*\n?(.*?)\n?\s*```', text, re.DOTALL)
    if code_block:
        try:
            return json.loads(code_block.group(1).strip())
        except (json.JSONDecodeError, ValueError):
            # Try fixing the code block content
            try:
                fixed = _fix_json_string(code_block.group(1).strip())
                return json.loads(fixed)
            except (json.JSONDecodeError, ValueError):
                pass
    
    # Strategy 3: Find outermost { ... } and try to parse
    brace_match = re.search(r'\{.*\}', text, re.DOTALL)
    if brace_match:
        raw = brace_match.group(0)
        try:
            return json.loads(raw)
        except (json.JSONDecodeError, ValueError):
            try:
                fixed = _fix_json_string(raw)
                return json.loads(fixed)
            except (json.JSONDecodeError, ValueError):
                pass
    
    # Strategy 4: Build a minimal valid response from text
    print(f"WARNING: Could not parse JSON from LLM. Using fallback extraction.")
    skills = []
    # Look for quoted strings that look like skill names
    quoted = re.findall(r'"name"\s*:\s*"([^"]+)"', text)
    for name in quoted[:20]:
        skills.append({"name": name, "confidence": 0.7, "category": "general"})
    
    if skills:
        return {"skills": skills, "experience_level": "mid"}
    
    return {"skills": [], "experience_level": "mid"}


async def extract_skills_from_resume(resume_text: str) -> dict:
    """
    Extract skills, experience level, and confidence scores from resume text.
    """
    prompt = f"""Analyze this resume and extract skills as JSON.

Return ONLY a JSON object (no markdown, no explanation) with this structure:
{{"skills": [{{"name": "Python", "confidence": 0.95, "category": "programming"}}], "experience_level": "mid"}}

Rules:
- confidence: 0.0-1.0 (1.0 = explicitly stated with evidence)
- experience_level: "junior" (0-2yr), "mid" (3-5yr), "senior" (6+yr)
- category: programming, data-science, devops, cloud, database, frontend, backend, mobile, testing, design, project-management, communication, leadership, operations, safety, finance, healthcare, education, general
- Include ALL skills (technical + soft skills)
- Normalize names (e.g. "JS" -> "JavaScript")

RESUME:
{resume_text[:6000]}"""

    try:
        client = _get_client()
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
            config=GenerateContentConfig(
                temperature=0.1,
                max_output_tokens=4096,
                response_mime_type="application/json",
            ),
        )

        result = _parse_json_from_response(response.text)
        
        # Validate structure
        if "skills" not in result:
            result["skills"] = []
        if "experience_level" not in result:
            result["experience_level"] = "mid"
        
        # Normalize confidence scores
        for skill in result["skills"]:
            skill["confidence"] = max(0.0, min(1.0, float(skill.get("confidence", 0.5))))
            if "category" not in skill:
                skill["category"] = "general"

        return result

    except Exception as e:
        # Retry once with simpler prompt
        try:
            client = _get_client()
            simple_prompt = f"""List all skills from this resume as JSON: {{"skills": [{{"name": "SkillName", "confidence": 0.8, "category": "general"}}], "experience_level": "mid"}}

Resume: {resume_text[:6000]}"""
            
            response = client.models.generate_content(
                model="gemini-1.5-flash",
                contents=simple_prompt,
                config=GenerateContentConfig(
                    temperature=0.2,
                    max_output_tokens=2048,
                    response_mime_type="application/json",
                ),
            )
            return _parse_json_from_response(response.text)
        except Exception as retry_error:
            raise RuntimeError(f"Skill extraction failed after retry: {retry_error}")


async def extract_skills_from_jd(jd_text: str) -> dict:
    """
    Extract required skills from a Job Description.
    """
    prompt = f"""Analyze this Job Description and extract required skills as JSON.

Return ONLY a valid JSON object:
{{"skills": [{{"name": "Python", "importance": "required", "category": "programming"}}], "experience_level": "senior"}}

Rules:
- importance: "required" or "preferred"
- experience_level: "junior", "mid", or "senior"
- category: programming, data-science, devops, cloud, database, frontend, backend, mobile, testing, design, project-management, communication, leadership, operations, safety, finance, healthcare, education, general
- Extract ONLY definite, learnable skills (not vague phrases)
- Normalize names

JD:
{jd_text[:3000]}"""

    try:
        client = _get_client()
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
            config=GenerateContentConfig(
                temperature=0.1,
                max_output_tokens=4096,
                response_mime_type="application/json",
            ),
        )

        result = _parse_json_from_response(response.text)
        
        if "skills" not in result:
            result["skills"] = []
        if "experience_level" not in result:
            result["experience_level"] = "mid"

        return result

    except Exception as e:
        try:
            client = _get_client()
            simple_prompt = f"""Extract skills from JD as JSON: {{"skills": [{{"name": "SkillName", "importance": "required", "category": "general"}}], "experience_level": "mid"}}
JD: {jd_text[:2000]}"""
            response = client.models.generate_content(
                model="gemini-1.5-flash",
                contents=simple_prompt,
                config=GenerateContentConfig(
                    temperature=0.2, 
                    max_output_tokens=2048,
                    response_mime_type="application/json",
                ),
            )
            return _parse_json_from_response(response.text)
        except Exception as retry_error:
            raise RuntimeError(f"JD skill extraction failed after retry: {retry_error}")
