"""
Gap Engine Service — Skill gap calculation with semantic matching.

Compares resume skills vs JD skills using both exact matching and
semantic similarity via sentence-transformers (no ChromaDB needed).
"""

from sentence_transformers import SentenceTransformer

# ─── Singleton Instances ──────────────────────────────────────

_embedder = None


def _get_embedder():
    """Get or create the sentence-transformer embedding model."""
    global _embedder
    if _embedder is None:
        _embedder = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedder


def semantic_match(query_skill: str, candidate_skills: list[str], threshold: float = 0.65) -> str | None:
    """
    Find the best semantic match for a query skill among candidates.
    
    Uses sentence-transformers to compute cosine similarity directly.
    No ChromaDB or external vector DB needed.
    
    Args:
        query_skill: Skill name to match
        candidate_skills: List of candidate skill names
        threshold: Minimum cosine similarity threshold
        
    Returns:
        Best matching skill name, or None if no match above threshold
    """
    if not candidate_skills:
        return None

    model = _get_embedder()
    query_emb = model.encode(query_skill, normalize_embeddings=True)
    candidate_embs = model.encode(candidate_skills, normalize_embeddings=True)

    # Compute cosine similarities
    similarities = query_emb @ candidate_embs.T

    best_idx = similarities.argmax()
    best_score = similarities[best_idx]

    if best_score >= threshold:
        return candidate_skills[best_idx]
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
