"""
Text Cleaner Service — Normalize and preprocess extracted text.

Handles whitespace normalization, artifact removal, and text cleaning.
"""

import re


def clean_text(text: str) -> str:
    """
    Clean and normalize extracted PDF/raw text.
    
    Operations:
    1. Remove non-printable characters
    2. Normalize whitespace (multiple spaces → single)
    3. Normalize line breaks
    4. Remove common PDF artifacts
    5. Strip leading/trailing whitespace
    
    Args:
        text: Raw extracted text
        
    Returns:
        Cleaned, normalized text
    """
    if not text:
        return ""

    # Remove non-printable characters (keep newlines, tabs)
    cleaned = re.sub(r'[^\x20-\x7E\n\t]', ' ', text)

    # Remove common PDF artifacts
    cleaned = re.sub(r'\x0c', '\n', cleaned)  # Form feed → newline
    cleaned = re.sub(r'[\x00-\x08\x0b\x0e-\x1f]', '', cleaned)  # Control chars

    # Normalize multiple spaces to single space
    cleaned = re.sub(r'[ \t]+', ' ', cleaned)

    # Normalize multiple newlines to double newline (paragraph break)
    cleaned = re.sub(r'\n\s*\n', '\n\n', cleaned)

    # Remove leading/trailing whitespace per line
    lines = [line.strip() for line in cleaned.split('\n')]
    cleaned = '\n'.join(lines)

    # Remove excessive blank lines (max 2 consecutive)
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)

    return cleaned.strip()


def extract_sections(text: str) -> dict[str, str]:
    """
    Attempt to extract labeled sections from resume text.
    
    Common sections: Education, Experience, Skills, Projects, etc.
    
    Args:
        text: Cleaned resume text
        
    Returns:
        Dictionary mapping section names to their content
    """
    section_headers = [
        r'(?i)(education|academic|qualification)',
        r'(?i)(experience|work\s*history|employment)',
        r'(?i)(skills|technical\s*skills|competencies)',
        r'(?i)(projects|portfolio)',
        r'(?i)(certifications?|certificates?)',
        r'(?i)(summary|objective|profile)',
        r'(?i)(achievements?|accomplishments?)',
    ]

    sections = {}
    current_section = "header"
    current_content = []

    for line in text.split('\n'):
        matched = False
        for pattern in section_headers:
            if re.match(pattern, line.strip()):
                # Save previous section
                if current_content:
                    sections[current_section] = '\n'.join(current_content).strip()
                current_section = re.sub(r'[^a-zA-Z ]', '', line.strip()).lower().strip()
                current_content = []
                matched = True
                break
        
        if not matched:
            current_content.append(line)

    # Save last section
    if current_content:
        sections[current_section] = '\n'.join(current_content).strip()

    return sections
