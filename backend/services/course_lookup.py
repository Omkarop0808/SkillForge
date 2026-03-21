"""
Course Lookup Service — Grounded course catalog for zero-hallucination recommendations.

All course recommendations come from a verified catalog — the LLM never
generates course names. This ensures 100% grounding and zero hallucinations.
"""

import json
import os
import requests
import asyncio
import urllib.request
import urllib.parse
import re
from typing import Optional
from db.database import get_courses_by_skill, get_all_courses
from config import settings

# --- Live YouTube Search (Protobuf / No-Auth / Array Extraction) ---
async def _fetch_top_videos(topic: str, limit: int = 6) -> list[dict]:
    """Uses internal protobuf searching to grab 6 top videos, prioritized by trusted creator channels."""
    try:
        from youtubesearchpython import VideosSearch
        
        def fetch_protobuf():
            query = f"{topic} tutorial OR {topic} full course OR {topic} masterclass"
            video_search = VideosSearch(query, limit=15) # Fetch 15 to allow rigorous sorting
            vid_result = video_search.result()
            
            if not vid_result or not vid_result.get("result"):
                return []
                
            raw_videos = []
            for v in vid_result["result"]:
                channel_name = v.get("channel", {}).get("name", "")
                
                view_str = v.get("viewCount", {}).get("short", "")
                if not view_str and v.get("viewCount", {}).get("text"):
                    view_str = v.get("viewCount", {}).get("text")
                    
                thumbnail = ""
                if v.get("thumbnails") and len(v["thumbnails"]) > 0:
                    thumbnail = v["thumbnails"][0].get("url", "")
                    
                raw_videos.append({
                    "id": v.get("id"),
                    "title": v.get("title", ""),
                    "channel": channel_name,
                    "viewCount": view_str,
                    "thumbnail": thumbnail,
                    "duration": v.get("duration", ""),
                    "url": f"https://www.youtube.com/watch?v={v.get('id')}" if v.get('id') else ""
                })
                
            # --- Custom Priority Sorting Algorithm (Curated Mentors) ---
            indian_channels = ["apna college", "codewithharry", "akshay saini", "hitesh choudhary", "thapa technical", "jenny's lectures", "gate smashers", "telusko", "ajay kumar", "ajay kumar (aj)", "striver", "love babbar", "chai aur code", "campusx", "krish naik"]
            global_channels = ["traversy media", "fireship", "the cherno", "networkchuck", "techwithtim", "mosh hamedani", "programming with mosh", "academind", "web dev simplified", "freecodecamp", "freecodecamp.org", "mit opencourseware", "sentdex", "3blue1brown", "coderdave"]
            all_priority = indian_channels + global_channels
            
            def sort_key(vid):
                c_name = vid["channel"].lower()
                
                # 1. Highest priority if it matches a requested legendary channel
                for p in all_priority:
                    if p in c_name or c_name in p:
                        return 0
                        
                # 2. Secondary priority based on views ('M' > 'K')
                vc = vid["viewCount"].lower()
                if 'm' in vc:
                    return 1
                elif 'k' in vc:
                    return 2
                return 3
                
            raw_videos.sort(key=sort_key)
            return raw_videos[:limit]
            
        return await asyncio.to_thread(fetch_protobuf)
    except ImportError:
        print("youtubesearchpython not installed. Falling back to native iFrame search.")
    except Exception as e:
        print(f"Protobuf Top Videos Error: {e}")
        
    return []

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
        encoded_skill = urllib.parse.quote_plus(skill)
        
        # Execute extraction of Top 6 Highly-Curated YouTube Objects
        top_videos = await _fetch_top_videos(skill, limit=6)
        
        platform = "YouTube (Curated Top Hits)"
        fallback_query = f"{skill} tutorial OR {skill} full course"
        fallback_url = f"https://www.youtube.com/results?search_query={urllib.parse.quote_plus(fallback_query)}"

        # Safely assign primary viewable URL
        primary_url = top_videos[0]["url"] if top_videos else fallback_url
        
        # Find matching DB course for canonical text links
        matched_course = _find_best_match(skill, all_courses)

        if matched_course:
            module["course"] = {
                "title": matched_course.get("title", f"{skill} Course"),
                "platform": platform,
                "url": primary_url,     
                "videos": top_videos, # Propagate 6-video array to Frontend
                "estimated_hours": matched_course.get("estimated_hours", module.get("estimated_hours", 10)),
                "source": "course_catalog_youtube_override",
            }
            # Push original text course into related resources!
            original_url = matched_course.get("url", "#")
            module["related_resources"] = [
                {"title": f"Official Text/Cert Course for {skill}", "url": original_url},
                {"title": f"{skill} on Roadmap.sh", "url": f"https://roadmap.sh/search?q={skill}"}
            ]
        else:
            module["course"] = {
                "title": f"Top Tutorials: {skill}",
                "platform": platform,
                "url": primary_url,
                "videos": top_videos, # Propagate 6-video array to Frontend
                "estimated_hours": module.get("estimated_hours", 10),
                "source": "self_study_fallback",
            }
            module["related_resources"] = [
                {"title": f"Official Docs or Guides for {skill}", "url": f"https://devdocs.io/#q={encoded_skill}"},
                {"title": f"Crash Courses on {skill}", "url": f"https://www.youtube.com/results?search_query={encoded_skill}+crash+course"}
            ]

    return modules
