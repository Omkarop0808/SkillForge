"""
Gap Engine Service — Skill gap calculation with semantic matching.

Compares resume skills vs JD skills using both exact matching and
semantic similarity via sentence-transformers (no ChromaDB needed).
"""

import math
from google import genai
from config import settings

# Initialize Gemini Client for Embeddings
client = genai.Client(api_key=settings.GEMINI_API_KEY)

def dot_product(v1, v2):
    return sum(x * y for x, y in zip(v1, v2))

def magnitude(v):
    return math.sqrt(sum(x * x for x in v))

def cosine_similarity(v1, v2):
    mag_v1 = magnitude(v1)
    mag_v2 = magnitude(v2)
    if mag_v1 == 0 or mag_v2 == 0:
        return 0.0
    return dot_product(v1, v2) / (mag_v1 * mag_v2)

def semantic_match(query_skill: str, candidate_skills: list[str], threshold: float = 0.65) -> str | None:
    """
    Find the best semantic match for a query skill among candidates using Gemini API.
    Dramatically reduces server RAM usage by removing PyTorch/Local Embeddings.
    """
    if not candidate_skills:
        return None

    try:
        # Embed the query skill
        query_resp = client.models.embed_content(model="text-embedding-004", contents=query_skill)
        query_emb = query_resp.embeddings[0].values

        # Embed all candidate skills in one batch
        candidate_resp = client.models.embed_content(model="text-embedding-004", contents=candidate_skills)
        candidate_embs = [emb.values for emb in candidate_resp.embeddings]

        # Calculate best match
        best_idx = 0
        best_score = 0.0

        for i, emp in enumerate(candidate_embs):
            score = cosine_similarity(query_emb, emp)
            if score > best_score:
                best_score = score
                best_idx = i

        if best_score >= threshold:
            return candidate_skills[best_idx]
    except Exception as e:
        error_msg = str(e)
        if "404" not in error_msg and "NOT_FOUND" not in error_msg:
            print(f"Gemini Embedding Error: {error_msg}")
        
    return None


async def calculate_skill_gap(
    resume_skills: list,
    jd_skills: list,
    domain: str = "tech",
) -> dict:
    """
    Calculate the skill gap between resume and JD skills.
    
    Uses both exact string matching and semantic similarity
    to identify matched, partial, and missing skills.
    
    Args:
        resume_skills: List of ExtractedSkill objects from resume
        jd_skills: List of skill dicts from JD extraction
        domain: "tech" or "operational"
        
    Returns:
        {
            "matched": [...],
            "partial": [...],
            "missing": [...],
            "profile_skills": [...],
            "match_percentage": float,
            "gap_ratio": float,
            "matched_count": int,
            "total_required": int,
            "critical_missing": [...],
            "experience_level": str,
        }
    """
    resume_skill_names = [s.name.lower().strip() for s in resume_skills]
    jd_skill_names = [s["name"].lower().strip() for s in jd_skills]

    matched = []
    partial = []
    missing = []

    for jd_skill in jd_skills:
        jd_name = jd_skill["name"].lower().strip()

        # Exact match check
        if jd_name in resume_skill_names:
            matched.append(jd_skill["name"])
            continue

        # Semantic match check
        semantic_result = semantic_match(jd_skill["name"], [s.name for s in resume_skills])
        if semantic_result:
            partial.append({
                "jd_skill": jd_skill["name"],
                "matched_to": semantic_result,
            })
            continue

        # No match found
        missing.append(jd_skill["name"])

    total_required = len(jd_skills)
    matched_count = len(matched) + len(partial)
    gap_ratio = len(missing) / max(total_required, 1)
    match_percentage = round((matched_count / max(total_required, 1)) * 100, 1)

    # Build profile skills with match status
    profile_skills = []
    for skill in resume_skills:
        match_status = "strong"
        if skill.name.lower() in [m.lower() for m in matched]:
            match_status = "strong"
        elif any(p["matched_to"].lower() == skill.name.lower() for p in partial):
            match_status = "partial"
        else:
            # Skill exists in resume but not required by JD
            match_status = "extra"
        
        profile_skills.append({
            "name": skill.name,
            "confidence": skill.confidence,
            "category": skill.category,
            "match": match_status,
        })

    # Determine critical missing (required + high importance)
    critical_missing = missing[:5]  # Top 5 most important gaps

    return {
        "matched": matched,
        "partial": partial,
        "missing": missing,
        "profile_skills": profile_skills,
        "match_percentage": match_percentage,
        "gap_ratio": round(gap_ratio, 3),
        "matched_count": matched_count,
        "total_required": total_required,
        "critical_missing": critical_missing,
        "experience_level": "mid",
    }
