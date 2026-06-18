import os
import uuid
from supabase import create_client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
BUCKET_NAME = "documents"

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY or "YOUR_SUPABASE" in SUPABASE_SERVICE_KEY:
    print("Warning: Supabase credentials not set or placeholder used. Storage operations will fail.")
    supabase = None
else:
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def upload_to_supabase(file_bytes: bytes, filename: str, content_type: str) -> str:
    """
    Uploads file bytes to Supabase Storage and returns the public URL.
    Generates a unique name under BUCKET_NAME.
    """
    if not supabase:
        raise RuntimeError("Supabase client is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_KEY to .env.")

    # Create a unique filename under the folder structure (e.g. uploads/, thumbnails/, signed/)
    unique_name = f"{uuid.uuid4()}_{filename}"

    # Upload the file bytes
    try:
        res = supabase.storage.from_(BUCKET_NAME).upload(
            path=unique_name,
            file=file_bytes,
            file_options={"content-type": content_type, "x-upsert": "true"}
        )
    except Exception as e:
        # Check if bucket doesn't exist, log helpful advice
        print(f"Error uploading to Supabase: {e}")
        raise RuntimeError(f"Supabase Storage Upload failed: {e}. Please ensure the '{BUCKET_NAME}' bucket exists and is public in Supabase.")

    # Get and return the public URL
    url_res = supabase.storage.from_(BUCKET_NAME).get_public_url(unique_name)
    return url_res

def delete_from_supabase(public_url: str):
    """
    Parses a public URL from Supabase Storage and deletes the corresponding object.
    """
    if not supabase or not public_url:
        return

    # Extract the unique filename from the URL
    # Format of get_public_url: https://<project_id>.supabase.co/storage/v1/object/public/documents/<filename>
    try:
        parts = public_url.split("/")
        filename = parts[-1]
        
        # Remove from storage
        supabase.storage.from_(BUCKET_NAME).remove([filename])
    except Exception as e:
        print(f"Error deleting file from Supabase Storage: {e}")