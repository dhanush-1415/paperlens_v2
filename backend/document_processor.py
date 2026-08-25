import os
import io
import base64
import requests
import fitz  # PyMuPDF
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Initialize Supabase client for Python
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", ""))

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def download_document_from_url(file_url: str) -> bytes:
    """Downloads a document from a public or signed URL."""
    response = requests.get(file_url)
    response.raise_for_status()
    return response.content

def process_pdf(file_bytes: bytes) -> dict:
    """
    Processes a PDF file using PyMuPDF.
    Returns a dictionary containing either extracted text, or base64 images if it's a scanned PDF.
    """
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    
    full_text = ""
    for page in doc:
        full_text += page.get_text() + "\n"
        
    # Heuristic: Check if the PDF is likely scanned (very little text)
    letter_count = sum(c.isalpha() for c in full_text)
    is_scanned = len(full_text.strip()) < 50 or (len(full_text.strip()) > 0 and (letter_count / len(full_text.strip()) < 0.4))
    
    if is_scanned:
        print("[Processor] Detected scanned PDF. Converting to base64 images for Vision AI.")
        images_base64 = []
        for page_num in range(min(10, len(doc))): # Limit to 10 pages to avoid massive payloads
            page = doc.load_page(page_num)
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2)) # 2x zoom for better OCR
            img_data = pix.tobytes("jpeg")
            img_b64 = base64.b64encode(img_data).decode("utf-8")
            images_base64.append(img_b64)
            
        return {
            "type": "vision",
            "images": images_base64,
            "text": "[Scanned Document: Analyzed via Vision API]"
        }
        
    return {
        "type": "text",
        "text": full_text.strip()
    }

def extract_document_content(file_url: str, filename: str) -> dict:
    """
    Main entry point for extracting content from a document url.
    """
    print(f"[Processor] Downloading {filename}...")
    file_bytes = download_document_from_url(file_url)
    
    ext = filename.lower().split('.')[-1]
    
    if ext == 'pdf':
        return process_pdf(file_bytes)
    elif ext in ['txt', 'md', 'csv']:
        # Native text file
        return {
            "type": "text",
            "text": file_bytes.decode('utf-8', errors='ignore')
        }
    elif ext in ['jpg', 'jpeg', 'png', 'webp']:
        # Native image file
        img_b64 = base64.b64encode(file_bytes).decode("utf-8")
        return {
            "type": "vision",
            "images": [img_b64],
            "text": "[Image File: Analyzed via Vision API]"
        }
    else:
        # Fallback unstructured or raw decode
        try:
            return {
                "type": "text",
                "text": file_bytes.decode('utf-8', errors='ignore')
            }
        except Exception as e:
            raise ValueError(f"Unsupported file format: {ext}")
