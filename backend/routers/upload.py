"""
Upload Router — Resume PDF upload and JD text input endpoints.

Handles file validation, text extraction, and initial skill extraction.
"""

import os
import uuid
import tempfile
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from typing import Optional

from config import settings
from services.pdf_parser import extract_text_from_pdf
from services.text_cleaner import clean_text
from services.skill_extractor import extract_skills_from_resume
from models.schemas import ResumeUploadResponse, ExtractedSkill

router = APIRouter()


@router.post("/upload/resume", response_model=ResumeUploadResponse)
async def upload_resume(file: UploadFile = File(...)):
    """
    Upload a resume PDF and extract skills.
    
    - Validates file type (PDF only) and size (max 5MB)
    - Extracts text using PyMuPDF
    - Cleans and preprocesses text
    - Extracts skills using Gemini LLM
    - Returns structured skill data with confidence scores
    """
    # Validate file type
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are accepted. Please upload a .pdf file."
        )

    # Validate file size
    contents = await file.read()
    max_size = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if len(contents) > max_size:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {settings.MAX_FILE_SIZE_MB}MB."
        )

    # Save to temp file for processing
    session_id = str(uuid.uuid4())
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        # Extract text from PDF
        raw_text = extract_text_from_pdf(tmp_path)
        if not raw_text or len(raw_text.strip()) < 50:
            raise HTTPException(
                status_code=400,
                detail="Could not extract text from PDF. The file may be image-based or empty. Please try pasting your resume text instead."
            )

        # Clean the extracted text
        cleaned_text = clean_text(raw_text)

        # Extract skills using LLM
        extraction_result = await extract_skills_from_resume(cleaned_text)

        # Convert dicts to Pydantic models
        skill_models = []
        for s in extraction_result.get("skills", []):
            skill_models.append(ExtractedSkill(
                name=s.get("name", "Unknown"),
                confidence=float(s.get("confidence", 0.5)),
                category=s.get("category", "general"),
            ))

        return ResumeUploadResponse(
            session_id=session_id,
            raw_text=cleaned_text,
            skills=skill_models,
            experience_level=extraction_result.get("experience_level", "mid"),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing resume: {str(e)}"
        )
    finally:
        # Clean up temp file
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


@router.post("/upload/jd")
async def upload_jd(
    jd_text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
):
    """
    Submit a Job Description as text or PDF.
    
    - Accepts raw text (min 50 words) or PDF upload
    - Validates input length and quality
    - Returns cleaned JD text
    """
    text = ""

    if file and file.filename:
        # Handle PDF upload
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are accepted.")
        
        contents = await file.read()
        max_size = settings.MAX_FILE_SIZE_MB * 1024 * 1024
        if len(contents) > max_size:
            raise HTTPException(status_code=400, detail=f"File too large. Max {settings.MAX_FILE_SIZE_MB}MB.")
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(contents)
            tmp_path = tmp.name
        
        try:
            text = extract_text_from_pdf(tmp_path)
        finally:
            os.unlink(tmp_path)

    elif jd_text:
        text = jd_text
    else:
        raise HTTPException(
            status_code=400,
            detail="Please provide either JD text or upload a JD PDF file."
        )

    # Validate minimum length
    word_count = len(text.split())
    if word_count < 50:
        raise HTTPException(
            status_code=400,
            detail=f"Job description is too short ({word_count} words). Please provide at least 50 words for accurate analysis."
        )

    cleaned = clean_text(text)
    return {"jd_text": cleaned, "word_count": len(cleaned.split())}
