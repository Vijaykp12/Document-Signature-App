from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.responses import FileResponse
from services.database import get_db
from middleware.auth import get_current_user
from models.document import Document
from models.user import User
import os
import shutil
import uuid
import fitz  # PyMuPDF

router = APIRouter(tags=["Documents"])

UPLOAD_DIR = "uploads"
THUMBNAIL_DIR = "thumbnails"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(THUMBNAIL_DIR, exist_ok=True)

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only Pdf files are allowed")

    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    pdf = fitz.open(file_path)

    page = pdf[0]
    pix = page.get_pixmap(
        matrix=fitz.Matrix(1.5, 1.5)
    )

    thumbnail_filename = f"{uuid.uuid4()}_thumbnail.png"
    thumbnail_path = os.path.join(THUMBNAIL_DIR, thumbnail_filename)
    pix.save(thumbnail_path)

    user = db.query(User).filter(User.email == current_user).first()

    document = Document(
        filename=file.filename,
        filepath=file_path,
        owner_id=user.id,
        thumbnail_path=thumbnail_path
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    return {
        "message": "Upload Success",
        "document_id": document.id,
        "thumbnail_url": f"/thumbnails/{thumbnail_filename}"
    }

@router.get("/my-documents")
def get_my_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        user = db.query(User).filter(
            User.email == current_user
        ).first()

        documents = db.query(Document).filter(
            Document.owner_id == user.id
        ).all()

        return [
            {
                "id": doc.id,
                "filename": doc.filename,
                "filepath": doc.filepath,
                "thumbnail": f"/thumbnails/{os.path.basename(doc.thumbnail_path)}"
                if doc.thumbnail_path else None
            }
            for doc in documents
        ]

    except Exception as e:
        print("ERROR:", e)
        raise

@router.get("/download/{document_id}")
def download_document(
    document_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == current_user).first()
    document = db.query(Document).filter(
            Document.id == document_id,
            Document.owner_id == user.id
        ).first()
    

    if not document:
        raise HTTPException(status_code = 404, detail = "Document not found")

    return FileResponse(
        path = document.filepath,
        filename = document.filename,
        media_type = "application/pdf"
    )

@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    user = db.query(User).filter(User.email == current_user).first()
    document = db.query(Document).filter(
            Document.id == document_id,
            Document.owner_id == user.id
        ).first()
    

    if not document:
        raise HTTPException(status_code = 404, detail = "Document not found")

    if os.path.exists(document.filepath):
        os.remove(document.filepath)

    db.delete(document)
    db.commit()

    return {
        "message": "Document deleted successfully"
    }