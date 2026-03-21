from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from services.web_scraper import extract_content
from google import genai
from config import settings
import json

router = APIRouter()

client = genai.Client(api_key=settings.GEMINI_API_KEY)

class URLRequest(BaseModel):
    url: str

class ScrapeResponse(BaseModel):
    title: str
    source_type: str
    topics: List[str]
    takeaways: List[str]

@router.post("/scrape-url", response_model=ScrapeResponse)
async def scrape_url_endpoint(req: URLRequest):
    """
    Takes a generic URL, scrapes its raw text via BeautifulSoup, or if it is a 
    YouTube URL, maps it directly into Gemini 2.5 via native Part.from_uri media ingestion,
    and returns a structured Note Card format.
    """
    try:
        is_youtube = 'youtube.com' in req.url or 'youtu.be' in req.url
        contents = []
        
        if is_youtube:
            # Native Gemini 1.5/2.0 YouTube Processing Loop
            from google.genai import types
            contents.append(
                types.Part.from_uri(
                    file_uri=req.url,
                    mime_type="video/mp4"
                )
            )
            source_type = "youtube"
        else:
            # Fallback for standard web scraping
            scraped_data = extract_content(req.url)
            raw_text = scraped_data["content"]
            source_type = scraped_data["source_type"]
            max_chars = 40000 
            if len(raw_text) > max_chars:
                raw_text = raw_text[:max_chars]
            contents.append(f"CONTENT TO ANALYZE:\n===\n{raw_text}\n===")

        # 2. Instruct Gemini to format the notes
        prompt = f"""
        You are an expert AI Learning Mentor.
        I have provided the {'YouTube video directly via URI' if is_youtube else 'scraped text content of a webpage'}.
        
        Analyze the {'video' if is_youtube else 'text'} and return a highly structured JSON response outlining the core learning material. Do not output anything except the JSON payload.
        
        JSON SCHEMA REQUIRED:
        {{
            "title": "A concise, accurate title for this content (max 8 words)",
            "topics": ["topic1", "topic2"], // Max 2 short topics
            "takeaways": [
                "Brief, actionable bullet point on core concept 1",
                "Brief, actionable bullet point on core concept 2",
                "Brief, actionable bullet point on core concept 3"
            ] // Max 3 highly condensed bullet points, be extremely brief
        }}
        """
        contents.append(prompt)
        
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=contents,
        )
        
        # Clean markdown wrappers if any
        result_text = response.text.replace("```json", "").replace("```", "").strip()
        
        try:
            parsed_json = json.loads(result_text)
        except json.JSONDecodeError:
            print(f"Gemini output parsing failed. Raw output: {result_text}")
            raise HTTPException(status_code=500, detail="Failed to parse AI summary.")
            
        return {
            "title": parsed_json.get("title", "Extracted Note"),
            "source_type": source_type,
            "topics": parsed_json.get("topics", []),
            "takeaways": parsed_json.get("takeaways", [])
        }
        
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        print(f"Scraper error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error processing URL.")
