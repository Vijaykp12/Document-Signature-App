import urllib.request
import fitz

def open_pdf_from_url_or_path(filepath_or_url: str) -> fitz.Document:
    """
    Opens a PDF document from either a local filesystem path or a remote HTTP/HTTPS URL.
    """
    if filepath_or_url.startswith("http://") or filepath_or_url.startswith("https://"):
        # Fetch from remote URL
        req = urllib.request.Request(
            filepath_or_url,
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        )
        with urllib.request.urlopen(req) as response:
            pdf_bytes = response.read()
        return fitz.open(stream=pdf_bytes, filetype="pdf")
    else:
        # Open from local path
        return fitz.open(filepath_or_url)
