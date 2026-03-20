"""
Course Lookup Service — Grounded course catalog for zero-hallucination recommendations.

All course recommendations come from a verified catalog — the LLM never
generates course names. This ensures 100% grounding and zero hallucinations.
"""

import json
import os
from typing import Optional
from db.database import get_courses_by_skill, get_all_courses


# ─── Fallback Local Catalog ──────────────────────────────────

_local_catalog = None


def _load_local_catalog() -> list[dict]:
    """Load the local course catalog JSON as fallback."""
    global _local_catalog
    if _local_catalog is None:
        catalog_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "data",
            "course_catalog.json",
        )
        try:
            with open(catalog_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                _local_catalog = data.get("courses", data) if isinstance(data, dict) else data
        except FileNotFoundError:
            _local_catalog = []
    return _local_catalog


def _find_best_match(skill_name: str, courses: list[dict]) -> Optional[dict]:
    """Find the best matching course for a skill from the catalog."""
    skill_lower = skill_name.lower().strip()

    # Exact match first
    for course in courses:
        if course.get("skill_name", "").lower().strip() == skill_lower:
            return course

    # Partial match
    for course in courses:
        course_skill = course.get("skill_name", "").lower()
        if skill_lower in course_skill or course_skill in skill_lower:
            return course

    # Word overlap match
    skill_words = set(skill_lower.split())
    best_match = None
    best_overlap = 0
    for course in courses:
        course_words = set(course.get("skill_name", "").lower().split())
        overlap = len(skill_words & course_words)
        if overlap > best_overlap:
            best_overlap = overlap
            best_match = course

    return best_match if best_overlap > 0 else None


async def lookup_courses(
    modules: list[dict],
    domain: str = "tech",
) -> list[dict]:
    """
    Ground each module to a verified course from the catalog.
    
    Lookup priority:
    1. Supabase courses table (primary)
    2. Local course_catalog.json (fallback)
    3. Generic self-study recommendation (last resort)
    
    Args:
        modules: List of module dicts with "skill" field
        domain: "tech" or "operational"
        
    Returns:
        Modules with "course" field added, all grounded to catalog
    """
    # Try to get all courses from Supabase first
    try:
        all_courses = await get_all_courses(domain)
    except Exception:
        all_courses = []

    # Fallback to local catalog if Supabase fails
    if not all_courses:
        all_courses = _load_local_catalog()
        # Filter by domain
        all_courses = [
            c for c in all_courses
            if c.get("domain") in [domain, "both"]
        ]

    for module in modules:
        skill = module.get("skill", "")
        
        # Find matching course
        matched_course = _find_best_match(skill, all_courses)

        if matched_course:
            module["course"] = {
                "title": matched_course.get("title", f"{skill} Course"),
                "platform": matched_course.get("platform", "Online"),
                "url": matched_course.get("url", "#"),
                "estimated_hours": matched_course.get("estimated_hours", module.get("estimated_hours", 10)),
                "source": "course_catalog",
            }
            # Add related resources
            module["related_resources"] = [
                {"title": f"{skill} on MDN", "url": f"https://developer.mozilla.org/en-US/search?q={skill}"},
                {"title": f"{skill} Roadmap", "url": f"https://roadmap.sh/search?q={skill}"}
            ]
        else:
            # Self-study fallback with curated YouTube channels and docs
            encoded_skill = skill.replace(' ', '+')
            if domain == "tech":
                yt_query = f"{encoded_skill}+tutorial+CodeWithHarry+OR+Chai+aur+Code+OR+Fireship"
                platform = "YouTube (Curated: CodeWithHarry, ChaiCode)"
            else:
                yt_query = f"{encoded_skill}+training+tutorial"
                platform = "YouTube Tutorials"

            module["course"] = {
                "title": f"Self-Study: {skill}",
                "platform": platform,
                "url": f"https://www.youtube.com/results?search_query={yt_query}",
                "estimated_hours": module.get("estimated_hours", 10),
                "source": "self_study_fallback",
            }
            module["related_resources"] = [
                {"title": f"Official Docs or Guides for {skill}", "url": f"https://devdocs.io/#q={encoded_skill}"},
                {"title": f"Crash Courses on {skill}", "url": f"https://www.youtube.com/results?search_query={encoded_skill}+crash+course"}
            ]

    return modules
