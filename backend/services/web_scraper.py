"""
Web Scraper Service
Handles extraction of YouTube Transcripts and generic Webpage text.
"""
import requests
from bs4 import BeautifulSoup
from youtube_transcript_api import YouTubeTranscriptApi
import re

def extract_youtube_video_id(url: str) -> str:
    """Extract the YouTube video ID from various URL formats."""
    patterns = [
        r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)',
        r'(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)',
        r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)'
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

def scrape_youtube(video_id: str) -> str:
    """Fetch the transcript of a YouTube video."""
    try:
        ytt_api = YouTubeTranscriptApi()
        transcript_obj = ytt_api.fetch(video_id)
        # Handle dict or snippet data class seamlessly
        iterable = transcript_obj.snippets if hasattr(transcript_obj, 'snippets') else transcript_obj
        full_text = " ".join([item.text if hasattr(item, 'text') else item['text'] for item in iterable])
        return full_text
    except Exception as e:
        raise ValueError(f"Could not extract transcript. Video might not have closed captions. Error: {str(e)}")

def scrape_webpage(url: str) -> str:
    """Fetch and extract visible text from a generic webpage."""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, 'html.parser')

        # Kill all script and style elements
        for script in soup(["script", "style", "nav", "footer", "header"]):
            script.extract()

        # Get text
        text = soup.get_text(separator=' ')

        # Break into lines and remove leading/trailing space
        lines = (line.strip() for line in text.splitlines())
        # Break multi-headlines into a line each
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        # Drop blank lines
        text = '\n'.join(chunk for chunk in chunks if chunk)
        
        return text
    except Exception as e:
        raise ValueError(f"Could not scrape webpage. Error: {str(e)}")

def extract_content(url: str) -> dict:
    """
    Main entry point to extract content from any URL.
    Returns a dict with 'source_type', 'content', and original 'url'.
    """
    is_youtube = 'youtube.com' in url.lower() or 'youtu.be' in url.lower()
    
    if is_youtube:
        video_id = extract_youtube_video_id(url)
        if not video_id:
            raise ValueError("Invalid YouTube URL format.")
        content = scrape_youtube(video_id)
        return {
            "source_type": "youtube",
            "url": url,
            "content": content
        }
    else:
        content = scrape_webpage(url)
        return {
            "source_type": "article",
            "url": url,
            "content": content
        }
