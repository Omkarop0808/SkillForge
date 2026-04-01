"""
Skill Sphere Router — Career persona, coach, job tracker AI match, peer learning,
personalized learning, interview feedback, market trends, portfolio HTML.
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse

from models.schemas import (
    CareerPersonaRequest,
    CareerCoachRequest,
    JobMatchRequest,
    PeerLearningRequest,
    PersonalizedLearningRequest,
    InterviewReportRequest,
    JobTrendsRequest,
    PortfolioRequest,
    RoleTargetsRequest,
)
from services import skill_sphere_ai

router = APIRouter(prefix="/skill-sphere", tags=["Skill Sphere"])


def _handle(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except RuntimeError as e:
        if "GEMINI" in str(e).upper() or "not configured" in str(e).lower():
            raise HTTPException(status_code=503, detail=str(e))
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Skill Sphere AI error: {str(e)}")


@router.post("/career-persona")
def career_persona(body: CareerPersonaRequest):
    data = _handle(
        skill_sphere_ai.generate_career_persona,
        body.resume_text,
        body.jd_text,
        body.resume_skills,
        body.gap_skills,
    )
    return {"persona": data}


@router.post("/career-coach")
def career_coach(body: CareerCoachRequest):
    msgs = [m.model_dump() for m in body.messages]
    data = _handle(
        skill_sphere_ai.career_coach_reply,
        msgs,
        body.resume_text,
        body.jd_text,
        body.resume_skills,
        body.gap_skills,
    )
    return data


@router.post("/job-match")
def job_match(body: JobMatchRequest):
    data = _handle(
        skill_sphere_ai.job_match_score,
        body.job_title,
        body.company,
        body.job_description,
        body.resume_skills,
    )
    return data


@router.post("/peer-learning")
def peer_learning(body: PeerLearningRequest):
    data = _handle(
        skill_sphere_ai.peer_learning_suggestions,
        body.target_role,
        body.resume_skills,
        body.gap_skills,
    )
    return data


@router.post("/personalized-learning")
def personalized_learning(body: PersonalizedLearningRequest):
    data = _handle(
        skill_sphere_ai.personalized_learning_path,
        body.gap_skills,
        body.domain,
        body.resume_skills,
    )
    return data


@router.post("/interview-report")
def interview_report(body: InterviewReportRequest):
    data = _handle(
        skill_sphere_ai.interview_performance_report,
        body.problem_statement,
        body.code,
        body.language,
    )
    return data


@router.post("/job-trends")
def job_trends(body: JobTrendsRequest):
    data = _handle(
        skill_sphere_ai.job_market_trends,
        body.profile_role_hint,
        body.resume_skills,
        body.location_hint,
    )
    return data


@router.post("/portfolio")
def portfolio_json(body: PortfolioRequest):
    data = _handle(
        skill_sphere_ai.portfolio_site_html,
        body.resume_text,
        body.name_hint,
    )
    return data


@router.post("/role-targets")
def role_targets(body: RoleTargetsRequest):
    data = _handle(
        skill_sphere_ai.suggest_roles_for_current_skills,
        body.resume_skills,
        body.skills_still_needed,
        body.experience_level,
        body.jd_text_snippet,
        body.match_percentage,
    )
    return data


@router.post("/portfolio/preview", response_class=HTMLResponse)
def portfolio_preview(body: PortfolioRequest):
    data = _handle(
        skill_sphere_ai.portfolio_site_html,
        body.resume_text,
        body.name_hint,
    )
    html = data.get("html", "")
    if not html.strip():
        raise HTTPException(status_code=500, detail="Empty portfolio HTML from model.")
    return HTMLResponse(content=html)
