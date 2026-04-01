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


# ─── Skill Sphere (Career intelligence hub) ───────────────────

class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant|system)$")
    content: str = Field(..., min_length=1, max_length=8000)


class SkillSphereContext(BaseModel):
    """Optional context from an existing SkillForge analysis session."""

    resume_text: str = ""
    jd_text: str = ""
    resume_skills: list[str] = []
    gap_skills: list[str] = []
    domain: str = "tech"


class CareerPersonaRequest(SkillSphereContext):
    pass


class CareerCoachRequest(SkillSphereContext):
    messages: list[ChatMessage] = Field(..., min_length=1)


class JobMatchRequest(SkillSphereContext):
    job_title: str = Field(..., min_length=1, max_length=200)
    company: str = Field(default="", max_length=200)
    job_description: str = Field(..., min_length=30, max_length=12000)


class PeerLearningRequest(SkillSphereContext):
    target_role: str = Field(..., min_length=2, max_length=200)


class PersonalizedLearningRequest(SkillSphereContext):
    pass


class InterviewReportRequest(BaseModel):
    problem_statement: str = Field(default="", max_length=4000)
    code: str = Field(..., min_length=1, max_length=14000)
    language: str = Field(default="python", max_length=40)


class JobTrendsRequest(SkillSphereContext):
    profile_role_hint: str = Field(default="Software Engineer", max_length=200)
    location_hint: str = Field(default="", max_length=120)


class PortfolioRequest(BaseModel):
    resume_text: str = Field(..., min_length=80, max_length=12000)
    name_hint: str = Field(default="Professional", max_length=120)


class RoleTargetsRequest(BaseModel):
    """Suggest roles reachable with current skills vs target JD gaps."""

    resume_skills: list[str] = Field(default_factory=list)
    skills_still_needed: list[str] = Field(default_factory=list)
    experience_level: str = Field(default="mid", max_length=24)
    jd_text_snippet: str = Field(default="", max_length=8000)
    match_percentage: float = Field(default=0.0, ge=0, le=100)
