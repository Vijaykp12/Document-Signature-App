from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from services.document_service import (
    upload_document_service,
    generate_signed_document_service,
    delete_document_service,
)
from middleware.auth import get_current_user
from services.database import get_db
from sqlalchemy.orm import Session
from models.document import Document
from pydantic import BaseModel
from schemas.document import (
    DocumentResponse,
    UploadResponse,
    SignedDocumentResponse,
)
from fastapi.responses import FileResponse
from models.user import User
import os   

router = APIRouter()

@router.post(
    "/upload",
    response_model=UploadResponse,
)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    document = upload_document_service(
        file,
        current_user,
        db,
    )

    return {
        "message": "Upload Success",
        "document_id": document.id,
        "thumbnail_url":
            f"/thumbnails/{os.path.basename(document.thumbnail_path)}",
    }

@router.get(
    "/my-documents",
    response_model=list[DocumentResponse],
)
def get_my_documents(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
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
            "thumbnail":
                f"/thumbnails/{os.path.basename(doc.thumbnail_path)}"
                if doc.thumbnail_path
                else None,
        }
        for doc in documents
    ]


@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    delete_document_service(
        document_id=document_id,
        current_user=current_user,
        db=db,
    )

    return {
        "message": "Document deleted successfully"
    }


@router.post(
    "/generate-signed/{document_id}",
    response_model=SignedDocumentResponse,
)
def generate_signed_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    document = generate_signed_document_service(
        document_id,
        current_user,
        db,
    )

    return {
        "message":
            "Signed document generated successfully",
        "path":
            f"/signed_documents/{os.path.basename(document.signed_filepath)}",
    }

@router.get("/download-signed/{document_id}")
def download_signed_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    user = db.query(User).filter(
        User.email == current_user
    ).first()

    document = db.query(Document).filter(
        Document.id == document_id,
        Document.owner_id == user.id,
    ).first()

    if not document or not document.is_signed:
        raise HTTPException(
            status_code=404,
            detail="Signed document not found",
        )

    return FileResponse(
        path=document.signed_filepath,
        filename=f"signed_{document.filename}",
        media_type="application/pdf",
    )