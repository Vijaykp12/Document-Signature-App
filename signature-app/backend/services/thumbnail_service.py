import fitz
import os
from utils.pdf_helper import open_pdf_from_url_or_path
from services.storage import upload_to_supabase

def generate_thumbnail(filepath: str) -> str:
    """
    Generates a PNG thumbnail from the first page of the PDF (local or remote URL)
    and uploads it to Supabase Storage, returning the public URL.
    """
    pdf = open_pdf_from_url_or_path(filepath)

    try:
        page = pdf[0]
        pix = page.get_pixmap(
            matrix=fitz.Matrix(1.5, 1.5)
        )

        # Get PNG bytes in-memory
        png_bytes = pix.tobytes("png")

        # Upload to Supabase Storage
        thumbnail_url = upload_to_supabase(
            file_bytes=png_bytes,
            filename="thumbnail.png",
            content_type="image/png"
        )

        return thumbnail_url

    finally:
        pdf.close()