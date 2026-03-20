"""
SkillForge Backend — FastAPI Application Entry Point

AI-Adaptive Onboarding Engine that parses resumes and job descriptions,
identifies skill gaps, and generates personalized learning roadmaps.
"""

import os
# Suppress TensorFlow/oneDNN warnings from sentence-transformers
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from config import settings
from routers import upload, analyze

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="SkillForge API",
    description="AI-Adaptive Onboarding Engine — Skill Gap Analysis & Learning Path Generation",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5180", "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(upload.router, prefix="/api", tags=["Upload"])
app.include_router(analyze.router, prefix="/api", tags=["Analysis"])


@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app": "SkillForge API",
        "version": "1.0.0",
    }


@app.get("/api/health", tags=["Health"])
async def health_check():
    """Detailed health check with service status."""
    return {
        "status": "healthy",
        "services": {
            "api": True,
            "supabase": settings.SUPABASE_URL is not None,
            "gemini": settings.GEMINI_API_KEY is not None,
        },
    }
