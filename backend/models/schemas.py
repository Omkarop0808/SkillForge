"""
SkillForge Pydantic Models — Request/Response Schemas

All data models for API endpoints.
"""

from pydantic import BaseModel, Field
from typing import Optional


# ─── Skill Models ─────────────────────────────────────────────

class ExtractedSkill(BaseModel):
    """A single skill extracted from resume or JD."""
    name: str = Field(..., description="Skill name (normalized)")
    confidence: float = Field(..., ge=0, le=1, description="Extraction confidence 0-1")
    category: str = Field(default="general", description="Skill category (programming, data-science, operations, etc.)")
    match: Optional[str] = Field(default=None, description="Match status: strong, partial, missing")


class ResumeUploadResponse(BaseModel):
    """Response after uploading and parsing a resume."""
    session_id: str
    raw_text: str
    skills: list[ExtractedSkill]
    experience_level: str = Field(..., description="junior, mid, or senior")


# ─── Analysis Models ─────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    """Request to analyze skill gap."""
    session_id: str
    resume_skills: list[ExtractedSkill]
    jd_text: str = Field(..., min_length=50, description="Job description text (min 50 chars)")
    domain: str = Field(default="tech", pattern="^(tech|operational)$")


class CourseRecommendation(BaseModel):
    """A grounded course recommendation from the catalog."""
    title: str
    platform: str
    url: str
    estimated_hours: float
    source: str = "course_catalog"


class ReasoningTrace(BaseModel):
    """Reasoning trace explaining why a module is recommended."""
    why_needed: str
    missing_skill: str
    prereqs_met: list[str]
    estimated_time: str
    course_source: str


class RoadmapModule(BaseModel):
    """A single module in the learning roadmap."""
    id: str
    skill: str
    difficulty: str = Field(..., pattern="^(beginner|intermediate|advanced)$")
    estimated_hours: float
    prerequisites: list[str]
    status: str = Field(default="locked", pattern="^(locked|available|completed)$")
    course: CourseRecommendation
    reasoning: ReasoningTrace


class RoadmapPhase(BaseModel):
    """A phase grouping of modules (for phased mode)."""
    name: str
    week_range: Optional[str] = None
    modules: list[RoadmapModule]


class FlowNode(BaseModel):
    """React Flow node format."""
    id: str
    type: str = "moduleNode"
    position: dict
    data: dict


class FlowEdge(BaseModel):
    """React Flow edge format."""
    id: str
    source: str
    target: str
    animated: bool = False


class ProfileSummary(BaseModel):
    """User's skill profile summary."""
    skills: list[ExtractedSkill]
    experience_level: str
    match_percentage: float


class GapSummary(BaseModel):
    """Skill gap analysis summary."""
    matched_count: int
    total_required: int
    gap_ratio: float
    critical_missing: list[str]
    estimated_total_hours: float


class AnalyzeResponse(BaseModel):
    """Complete analysis response with profile, gap, and roadmap."""
    session_id: str
    profile: ProfileSummary
    gap_summary: GapSummary
    roadmap: dict  # Contains mode, phases, nodes, edges


# ─── Progress Models ─────────────────────────────────────────

class ProgressUpdateRequest(BaseModel):
    """Request to update module completion progress."""
    session_id: str
    completed_module_ids: list[str]


class ProgressUpdateResponse(BaseModel):
    """Response after updating progress."""
    completion_percentage: float
    updated_modules: list[dict]
    newly_unlocked: list[str]
