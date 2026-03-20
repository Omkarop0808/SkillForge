"""
PDF Parser Service — Extract text from PDF files using PyMuPDF.

Uses PyMuPDF for fast, reliable text extraction.
Handles both old (fitz) and new (pymupdf) import styles.
"""

try:
    import fitz  # PyMuPDF (older import style)
except ImportError:
    import pymupdf as fitz  # PyMuPDF >= 1.24.x new import


def extract_text_from_pdf(file_path: str) -> str:
    """
    Extract all text from a PDF file.
    
    Args:
        file_path: Path to the PDF file
        
    Returns:
        Extracted text as a single string
        
    Raises:
        ValueError: If the PDF cannot be opened or has no extractable text
    """
    try:
        doc = fitz.open(file_path)
        text_parts = []

        for page_num in range(len(doc)):
            page = doc[page_num]
            page_text = page.get_text("text")
            if page_text:
                text_parts.append(page_text)

        doc.close()

        full_text = "\n".join(text_parts)
        return full_text.strip()

    except Exception as e:
        raise ValueError(f"Failed to extract text from PDF: {str(e)}")
