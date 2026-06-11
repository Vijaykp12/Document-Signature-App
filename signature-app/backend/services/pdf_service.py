import fitz
import os
import shutil
import uuid

UPLOAD_DIR = "uploads"
SIGNED_DIR = "signed_documents"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(SIGNED_DIR, exist_ok=True)


def save_pdf(file):
    unique_filename = f"{uuid.uuid4()}_{file.filename}"

    filepath = os.path.join(
        UPLOAD_DIR,
        unique_filename
    )

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return filepath


def generate_signed_pdf(filepath, signatures):
    pdf = fitz.open(filepath)

    try:
        for sig in signatures:
            page = pdf[sig.page - 1]

            rect = page.rect

            page.insert_text(
                (
                    sig.x * rect.width,
                    sig.y * rect.height,
                ),
                "Signed",
                fontsize=20,
                color=(1, 0, 0),
            )

        signed_filename = (
            f"signed_{uuid.uuid4()}.pdf"
        )

        signed_filepath = os.path.join(
            SIGNED_DIR,
            signed_filename,
        )

        pdf.save(signed_filepath)

        return signed_filepath

    finally:
        pdf.close()