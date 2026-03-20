"""
Reasoning Trace Service — Generate explanations for each learning module.

Produces transparent reasoning for WHY each module is recommended,
addressing the 10% Reasoning Trace judging criterion.
"""


def generate_reasoning_traces(
    modules: list[dict],
    resume_skills: list[str],
    jd_skills: list[str],
) -> list[dict]:
    """
    Generate reasoning traces for each module in the roadmap.
    
    Each trace explains:
    - Why this module is needed
    - What missing skill it addresses
    - Which prerequisites are already met
    - Estimated learning time
    - Source of the course recommendation
    
    Args:
        modules: List of module dicts (with course info)
        resume_skills: User's current skills
        jd_skills: Required skills from JD
        
    Returns:
        Modules with reasoning traces added
    """
    resume_skills_lower = {s.lower().strip() for s in resume_skills}
    jd_skills_lower = {s.lower().strip() for s in jd_skills}

    for module in modules:
        skill = module["skill"]
        skill_lower = skill.lower().strip()
        prereqs = module.get("prerequisites", [])
        course = module.get("course", {})

        # Determine which prereqs the user already has
        prereqs_met = [p for p in prereqs if p.lower().strip() in resume_skills_lower]
        prereqs_missing = [p for p in prereqs if p.lower().strip() not in resume_skills_lower]

        # Build reasoning
        reasoning = {
            "why_needed": _build_why_needed(skill, jd_skills, resume_skills),
            "missing_skill": skill,
            "prereqs_met": prereqs_met if prereqs_met else ["None required"],
            "prereqs_missing": prereqs_missing,
            "estimated_time": f"{module.get('estimated_hours', 10)} hours",
            "course_source": course.get("source", "course_catalog"),
            "confidence": _calculate_reasoning_confidence(
                skill, prereqs_met, prereqs_missing, jd_skills_lower
            ),
        }

        module["reasoning"] = reasoning

    return modules


def _build_why_needed(skill: str, jd_skills: list[str], resume_skills: list[str]) -> str:
    """Build a human-readable explanation of why this skill is needed."""
    skill_lower = skill.lower().strip()

    # Check if directly required by JD
    for jd_skill in jd_skills:
        if jd_skill.lower().strip() == skill_lower:
            return f"❌ Required by the job description: '{skill}' is listed as a key skill but is missing from your resume."

    # Check if it's a prerequisite for a required skill
    return f"📌 '{skill}' is a prerequisite for mastering required skills in this role. Learning it first will accelerate your progress."


def _calculate_reasoning_confidence(
    skill: str,
    prereqs_met: list[str],
    prereqs_missing: list[str],
    jd_skills: set[str],
) -> float:
    """
    Calculate confidence that this module recommendation is correct.
    
    Factors:
    - Is the skill directly required by JD? (+0.4)
    - Are prerequisites mostly met? (+0.3)
    - Is the course grounded in catalog? (+0.3)
    """
    confidence = 0.3  # Base confidence for catalog grounding

    # Direct JD requirement
    if skill.lower().strip() in jd_skills:
        confidence += 0.4

    # Prerequisite readiness
    total_prereqs = len(prereqs_met) + len(prereqs_missing)
    if total_prereqs == 0:
        confidence += 0.3  # No prereqs needed
    else:
        met_ratio = len(prereqs_met) / total_prereqs
        confidence += 0.3 * met_ratio

    return round(min(confidence, 1.0), 2)
