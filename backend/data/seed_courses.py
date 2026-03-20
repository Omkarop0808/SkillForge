"""
Seed Script — Load course catalog data into Supabase.

Run this once to populate the courses table from course_catalog.json.
Usage: python seed_courses.py
"""

import json
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv
load_dotenv()

from supabase import create_client


def seed_courses():
    """Load all courses from JSON catalog into Supabase."""
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_ANON_KEY")

    if not url or not key:
        print("❌ ERROR: SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env")
        return

    supabase = create_client(url, key)

    # Load catalog
    catalog_path = os.path.join(os.path.dirname(__file__), "course_catalog.json")
    with open(catalog_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    courses = data.get("courses", data)
    print(f"📦 Found {len(courses)} courses in catalog")

    # Clear existing courses
    try:
        supabase.table("courses").delete().neq("id", 0).execute()
        print("🗑️  Cleared existing courses")
    except Exception as e:
        print(f"⚠️  Could not clear courses (table may not exist yet): {e}")

    # Insert in batches of 20
    batch_size = 20
    inserted = 0
    for i in range(0, len(courses), batch_size):
        batch = courses[i:i + batch_size]
        rows = []
        for c in batch:
            rows.append({
                "skill_name": c["skill_name"],
                "course_title": c["title"],
                "platform": c["platform"],
                "url": c["url"],
                "estimated_hours": c.get("estimated_hours", 10),
                "difficulty": c.get("difficulty", "intermediate"),
                "domain": c.get("domain", "tech"),
                "category": c.get("category", "general"),
            })

        try:
            result = supabase.table("courses").insert(rows).execute()
            inserted += len(rows)
            print(f"  ✅ Inserted batch {i // batch_size + 1} ({len(rows)} courses)")
        except Exception as e:
            print(f"  ❌ Batch {i // batch_size + 1} failed: {e}")

    print(f"\n🎉 Done! Inserted {inserted}/{len(courses)} courses into Supabase")


if __name__ == "__main__":
    seed_courses()
