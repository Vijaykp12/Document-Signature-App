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


def hex_to_rgb(hex_str: str, default=(0.06, 0.09, 0.16)):
    if not hex_str:
        return default
    
    hex_str = hex_str.strip()
    if hex_str.startswith("#"):
        hex_str = hex_str[1:]
        
    if len(hex_str) == 6:
        try:
            r = int(hex_str[0:2], 16) / 255.0
            g = int(hex_str[2:4], 16) / 255.0
            b = int(hex_str[4:6], 16) / 255.0
            return (r, g, b)
        except ValueError:
            pass
    elif len(hex_str) == 3:
        try:
            r = int(hex_str[0] * 2, 16) / 255.0
            g = int(hex_str[1] * 2, 16) / 255.0
            b = int(hex_str[2] * 2, 16) / 255.0
            return (r, g, b)
        except ValueError:
            pass
            
    color_map = {
        "red": (0.937, 0.267, 0.267),
        "blue": (0.231, 0.510, 0.965),
        "green": (0.063, 0.725, 0.506),
        "slate": (0.059, 0.090, 0.165),
    }
    return color_map.get(hex_str.lower(), default)


def get_font_info(font_value: str):
    if not font_value:
        return None, None
        
    current_dir = os.path.dirname(os.path.abspath(__file__))
    font_dir = os.path.join(current_dir, "..", "resources", "fonts")
    
    font_value_lower = font_value.lower()
    if "pacifico" in font_value_lower:
        name = "pacifico"
        filename = "Pacifico-Regular.ttf"
    elif "great vibes" in font_value_lower:
        name = "great_vibes"
        filename = "GreatVibes-Regular.ttf"
    elif "dancing script" in font_value_lower:
        name = "dancing_script"
        filename = "DancingScript-Regular.ttf"
    elif "alex brush" in font_value_lower:
        name = "alex_brush"
        filename = "AlexBrush-Regular.ttf"
    else:
        name = "pacifico"
        filename = "Pacifico-Regular.ttf"
        
    path = os.path.join(font_dir, filename)
    if os.path.exists(path):
        return name, path
        
    fallback_path = "C:/Windows/Fonts/segoesc.ttf"
    if os.path.exists(fallback_path):
        return "segoesc", fallback_path
        
    return None, None


def generate_signed_pdf(filepath, signatures):
    pdf = fitz.open(filepath)

    try:
        for sig in signatures:
            page = pdf[sig.page - 1]

            rect = page.rect

            # Determine text, color, and font settings
            sig_text = sig.text if sig.text else "Signed"
            sig_color = hex_to_rgb(sig.color)
            font_name, font_path = get_font_info(sig.font)

            kwargs = {
                "fontsize": 24,
                "color": sig_color,
            }
            if font_name and font_path:
                kwargs["fontname"] = font_name
                kwargs["fontfile"] = font_path

            page.insert_text(
                (
                    sig.x * rect.width,
                    sig.y * rect.height,
                ),
                sig_text,
                **kwargs
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