from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.responses import FileResponse
from services.database import get_db
from middleware.auth import get_current_user
from models.document import Document
from models.user import User
import os
import shutil

router = APIRouter(tags=["Documents"])

UPLOAD_DIR = "uploads"

os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only Pdf files are allowed")

    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    user = db.query(User).filter(User.email == current_user).first()

    document = Document(
        filename=file.filename,
        filepath=file_path,
        owner_id=user.id
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    return {
        "message": "Upload Success",
        "document_id": document.id
    }

@router.get("/my-documents")
def get_my_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
): 

    user = db.query(User).filter(User.email == current_user).first()
    documents = db.query(Document).filter(
            Document.owner_id == user.id
        ).all()
    

    return documents

@router.get("/download/{document_id}")
def download_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
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
    current_user: User = Depends(get_current_user)
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