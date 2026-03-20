from fastapi import APIRouter
from typing import Dict, Any

router = APIRouter()

@router.get("/demo/seed", summary="Pre-seeded hackathon demo data")
async def get_demo_seed() -> Dict[str, Any]:
    """
    Returns a mathematically perfect, fully populated demo state for the hackathon showcase.
    This corresponds to the demo@skillforge.ai account.
    """
    return {
        "status": "success",
        "message": "Demo data loaded successfully.",
        "data": {
            "demo_user": {
                "email": "demo@skillforge.ai",
                "name": "Jane Doe",
                "role": "Senior Full Stack Dev"
            },
            "result": {
                "profile": {
                    "experience_level": "Senior",
                    "skills": [
                        {"name": "Python", "match": "strong", "confidence": 0.95},
                        {"name": "React", "match": "strong", "confidence": 0.92},
                        {"name": "Machine Learning", "match": "missing", "confidence": 0.10}
                    ]
                },
                "gap_summary": {
                    "match_percentage": 65.5,
                    "total_required": 12,
                    "matched_count": 8,
                    "critical_missing": ["Machine Learning", "TensorFlow", "FastAPI"],
                    "estimated_total_hours": 45
                },
                "roadmap": {
                    "mode": "phased",
                    "phases": [
                        {
                            "phase_name": "Phase 1",
                            "modules": [
                                {
                                    "id": "demo-1",
                                    "skill": "FastAPI",
                                    "status": "completed",
                                    "difficulty": "intermediate",
                                    "estimated_hours": 10,
                                    "reasoning": {
                                        "why_needed": "Required for building the backend AI engine.",
                                        "prereqs_met": ["Python"],
                                        "estimated_time": "10 hours",
                                        "course_source": "YouTube (CodeWithHarry)"
                                    },
                                    "course": {
                                        "title": "FastAPI Full Course in Hindi",
                                        "platform": "YouTube",
                                        "url": "https://www.youtube.com/watch?v=0RS9W8MtZe4" 
                                    },
                                    "related_resources": [
                                        {"title": "FastAPI Official Docs", "url": "https://fastapi.tiangolo.com/"}
                                    ]
                                },
                                {
                                    "id": "demo-2",
                                    "skill": "TensorFlow",
                                    "status": "available",
                                    "difficulty": "advanced",
                                    "estimated_hours": 20,
                                    "reasoning": {
                                        "why_needed": "Crucial for the ML modeling requirements in the JD.",
                                        "prereqs_met": ["Python", "Machine Learning theory"],
                                        "estimated_time": "20 hours",
                                        "course_source": "YouTube (Krish Naik)"
                                    },
                                    "course": {
                                        "title": "TensorFlow 2.0 Complete Course",
                                        "platform": "YouTube",
                                        "url": "https://www.youtube.com/watch?v=tPYj3fFJGjk"
                                    },
                                    "related_resources": [
                                        {"title": "TensorFlow API Docs", "url": "https://www.tensorflow.org/api_docs"}
                                    ]
                                },
                                {
                                    "id": "demo-3",
                                    "skill": "Machine Learning",
                                    "status": "available",
                                    "difficulty": "advanced",
                                    "estimated_hours": 15,
                                    "reasoning": {
                                        "why_needed": "Core requirement for the AI-Adaptive role.",
                                        "prereqs_met": [],
                                        "estimated_time": "15 hours",
                                        "course_source": "YouTube (CampusX)"
                                    },
                                    "course": {
                                        "title": "100 Days of Machine Learning",
                                        "platform": "YouTube",
                                        "url": "https://www.youtube.com/watch?v=1mWEyoVKyww"
                                    },
                                    "related_resources": [
                                        {"title": "Scikit-Learn Docs", "url": "https://scikit-learn.org/"}
                                    ]
                                }
                            ]
                        }
                    ]
                }
            }
        }
    }
