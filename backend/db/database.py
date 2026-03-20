"""
Database Module — Supabase + ChromaDB Setup

Handles all database connections and operations.
"""

import os
from supabase import create_client, Client
from config import settings

# ─── Supabase Client ─────────────────────────────────────────

_supabase_client: Client | None = None


def get_supabase() -> Client:
    """Get or create the Supabase client singleton."""
    global _supabase_client
    if _supabase_client is None:
        if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
            raise RuntimeError(
                "Supabase credentials not configured. "
                "Set SUPABASE_URL and SUPABASE_ANON_KEY in .env"
            )
        _supabase_client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_ANON_KEY,
        )
    return _supabase_client


# ─── Session Operations ──────────────────────────────────────

async def save_session(session_id: str, request, response) -> dict:
    """Save analysis session to Supabase."""
    try:
        supabase = get_supabase()
        data = {
            "id": session_id,
            "resume_text": request.resume_skills[0].name if request.resume_skills else "",
            "jd_text": request.jd_text[:500],  # Store first 500 chars
            "domain": request.domain,
            "analysis_result": response.model_dump(),
        }
        result = supabase.table("sessions").upsert(data).execute()
        return result.data[0] if result.data else {}
    except Exception as e:
        print(f"Warning: Could not save session to Supabase: {e}")
        return {}


async def get_session(session_id: str) -> dict | None:
    """Retrieve a session from Supabase."""
    try:
        supabase = get_supabase()
        result = supabase.table("sessions").select("*").eq("id", session_id).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        print(f"Warning: Could not retrieve session from Supabase: {e}")
        return None


# ─── Course Catalog Operations ───────────────────────────────

async def get_courses_by_skill(skill_name: str, domain: str = "tech") -> list[dict]:
    """Query courses from Supabase by skill name and domain."""
    try:
        supabase = get_supabase()
        result = (
            supabase.table("courses")
            .select("*")
            .ilike("skill_name", f"%{skill_name}%")
            .in_("domain", [domain, "both"])
            .execute()
        )
        return result.data or []
    except Exception as e:
        print(f"Warning: Could not query courses: {e}")
        return []


async def get_all_courses(domain: str = "tech") -> list[dict]:
    """Get all courses for a domain."""
    try:
        supabase = get_supabase()
        result = (
            supabase.table("courses")
            .select("*")
            .in_("domain", [domain, "both"])
            .execute()
        )
        return result.data or []
    except Exception as e:
        print(f"Warning: Could not fetch courses: {e}")
        return []


# ─── Skill Taxonomy Operations ───────────────────────────────

async def get_skill_taxonomy(domain: str = "tech") -> list[dict]:
    """Get skill taxonomy entries from Supabase."""
    try:
        supabase = get_supabase()
        result = supabase.table("skill_taxonomy").select("*").execute()
        return result.data or []
    except Exception as e:
        print(f"Warning: Could not fetch taxonomy: {e}")
        return []
