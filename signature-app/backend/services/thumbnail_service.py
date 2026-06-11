import fitz
import os
import uuid

THUMBNAIL_DIR = "thumbnails"

os.makedirs(THUMBNAIL_DIR, exist_ok=True)


def generate_thumbnail(filepath):
    pdf = fitz.open(filepath)

    try:
        page = pdf[0]

        pix = page.get_pixmap(
            matrix=fitz.Matrix(1.5, 1.5)
        )

        filename = (
            f"{uuid.uuid4()}_thumbnail.png"
        )

        path = os.path.join(
            THUMBNAIL_DIR,
            filename,
        )

        pix.save(path)

        return path

    finally:
        pdf.close()