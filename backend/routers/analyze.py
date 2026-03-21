"""
Analyze Router — Skill gap analysis and roadmap generation endpoint.

Orchestrates the full analysis pipeline:
  Resume skills + JD text → Gap analysis → Adaptive path → Roadmap
"""

import uuid
from fastapi import APIRouter, HTTPException

from models.schemas import (
    AnalyzeRequest, AnalyzeResponse, ProgressUpdateRequest, ProgressUpdateResponse,
    ProfileSummary, GapSummary, ExtractedSkill
)
from services.skill_extractor import extract_skills_from_jd
from services.gap_engine import calculate_skill_gap
from services.graph_builder import build_skill_graph
from services.path_optimizer import build_adaptive_path
from services.reasoning_trace import generate_reasoning_traces
from services.course_lookup import lookup_courses
from db.database import save_session, get_session

router = APIRouter()


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_gap(request: AnalyzeRequest):
    """
    Perform full skill gap analysis and generate learning roadmap.
    
    Pipeline:
    1. Extract skills from JD text
    2. Calculate gap between resume and JD skills
    3. Build skill prerequisite graph (NetworkX)
    4. Generate adaptive learning path
    5. Ground each module to verified course catalog
    6. Generate reasoning traces
    7. Format as React Flow nodes/edges
    """
    try:
        # Step 1: Extract skills from JD
        jd_extraction = await extract_skills_from_jd(request.jd_text)
        jd_skills = jd_extraction["skills"]

        # Step 2: Calculate skill gap
        gap_result = await calculate_skill_gap(
            resume_skills=request.resume_skills,
            jd_skills=jd_skills,
            domain=request.domain,
        )

        # Step 3: Build skill prerequisite graph
        partial_skills = [p["jd_skill"] for p in gap_result.get("partial", [])]
        combined_missing = gap_result["missing"] + partial_skills

        skill_graph = build_skill_graph(
            missing_skills=combined_missing,
            resume_skills=[s.name for s in request.resume_skills],
            domain=request.domain,
            partial_skills=partial_skills,
        )

        # Step 4: Generate adaptive path
        adaptive_path = build_adaptive_path(
            graph=skill_graph,
            gap_ratio=gap_result["gap_ratio"],
            resume_skills=[s.name for s in request.resume_skills],
        )

        # Step 5: Ground to course catalog
        grounded_modules = await lookup_courses(
            modules=adaptive_path["modules"],
            domain=request.domain,
        )

        # Step 6: Generate reasoning traces
        modules_with_reasoning = generate_reasoning_traces(
            modules=grounded_modules,
            resume_skills=[s.name for s in request.resume_skills],
            jd_skills=[s["name"] for s in jd_skills],
        )

        # Build profile skills as Pydantic models
        profile_skill_models = []
        for ps in gap_result["profile_skills"]:
            profile_skill_models.append(ExtractedSkill(
                name=ps["name"],
                confidence=float(ps.get("confidence", 0.5)),
                category=ps.get("category", "general"),
                match=ps.get("match"),
            ))

        # Build response with proper Pydantic models
        response = AnalyzeResponse(
            session_id=request.session_id,
            profile=ProfileSummary(
                skills=profile_skill_models,
                experience_level=gap_result.get("experience_level", "mid"),
                match_percentage=gap_result["match_percentage"],
            ),
            gap_summary=GapSummary(
                matched_count=gap_result["matched_count"],
                total_required=gap_result["total_required"],
                gap_ratio=gap_result["gap_ratio"],
                critical_missing=gap_result["critical_missing"][:3],
                estimated_total_hours=adaptive_path["total_hours"],
            ),
            roadmap={
                "mode": adaptive_path["mode"],
                "phases": adaptive_path["phases"],
                "nodes": adaptive_path["nodes"],
                "edges": adaptive_path["edges"],
            },
        )

        # Save session to Supabase
        await save_session(request.session_id, request, response)

        return response

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}. Please try again."
        )


@router.post("/progress/update", response_model=ProgressUpdateResponse)
async def update_progress(request: ProgressUpdateRequest):
    """
    Update module completion and unlock next available modules.
    
    - Marks specified modules as completed
    - Unlocks modules whose prerequisites are now met
    - Recalculates completion percentage
    """
    try:
        session = await get_session(request.session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found.")

        roadmap = session.get("analysis_result", {}).get("roadmap", {})
        all_modules = []
        for phase in roadmap.get("phases", []):
            all_modules.extend(phase.get("modules", []))

        completed_ids = set(request.completed_module_ids)
        newly_unlocked = []

        # Update module statuses
        for module in all_modules:
            if module["id"] in completed_ids:
                module["status"] = "completed"

        # Unlock modules whose prerequisites are all completed
        completed_skills = {m["skill"] for m in all_modules if m["status"] == "completed"}
        for module in all_modules:
            if module["status"] == "locked":
                prereqs = set(module.get("prerequisites", []))
                if prereqs.issubset(completed_skills):
                    module["status"] = "available"
                    newly_unlocked.append(module["id"])

        total = len(all_modules)
        completed_count = sum(1 for m in all_modules if m["status"] == "completed")
        completion_pct = (completed_count / total * 100) if total > 0 else 0

        return ProgressUpdateResponse(
            completion_percentage=round(completion_pct, 1),
            updated_modules=all_modules,
            newly_unlocked=newly_unlocked,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Progress update failed: {str(e)}")


@router.get("/courses/{skill_name}")
async def get_courses_for_skill(skill_name: str, domain: str = "tech"):
    """
    Get available courses for a specific skill from the grounded catalog.
    """
    courses = await lookup_courses(
        modules=[{"skill": skill_name, "difficulty": "beginner"}],
        domain=domain,
    )
    return {"skill": skill_name, "courses": courses}
