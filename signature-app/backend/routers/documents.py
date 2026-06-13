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
    SigningLinkCreate
)
from fastapi.responses import FileResponse
from models.user import User
from models.signing_link import SigningLink
import os  
import uuid 
from datetime import datetime, timedelta

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

    print("DOWNLOADING:", document.signed_filepath)
    print("EXISTS:", os.path.exists(document.signed_filepath))

    if os.path.exists(document.signed_filepath):
        print(
            "SIZE:",
            os.path.getsize(document.signed_filepath)
        )

    return FileResponse(
        path=document.signed_filepath,
        filename=f"signed_{document.filename}",
        media_type="application/pdf",
    )

@router.post("/create-signing-link")
def create_signing_link(
    payload: SigningLinkCreate,
    db:Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    user = db.query(User).filter(User.email == current_user).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    document = db.query(Document).filter(Document.id == payload.document_id, Document.owner_id == user.id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found or you do not have permission to create a signing link for this document")
    
    doc_token = str(uuid.uuid4())

    link = SigningLink(
        document_id=payload.document_id,
        token=doc_token,
        signer_email=payload.signer_email,
        expires_at=datetime.utcnow() + timedelta(days=payload.expires_in)
    )

    db.add(link)
    db.commit()
    db.refresh(link)

    FRONTEND_URL = os.getenv("FRONTEND_URL")

    return {
        "message": "Signing link created successfully",
        "signing_link": f"{FRONTEND_URL}/sign/{doc_token}"
    }


@router.get("public-document/preview/{token}")
def get_public_preview(
    token: str,
    db: Session = Depends(get_db)
):
    link = db.query(SigningLink).filter(
        SigningLink.token == token
    ).first()

    if not link:
        raise HTTPException(
            status_code=404,
            detail="Signing link not found"
        )

    if link.expires_at and link.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=410,
            detail="Signing link has expired"
        )

    if link.is_used:
        raise HTTPException(
            status_code=410,
            detail="This signing link has already been used"
        )

    document = db.query(Document).filter(
        Document.id == link.document_id
    ).first()

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    return {
        "document_id": document.id,
        "filename": document.filename,
        "thumbnail": (
            f"/thumbnails/{os.path.basename(document.thumbnail_path)}"
            if document.thumbnail_path
            else None
        ),
        "pdf_url": f"/public-sign/file/{token}",
        "signer_email": link.signer_email,
        "expires_at": link.expires_at,
    }


@router.get("/public-document/pdf/{token}")
def get_public_document(
    token: str,
    db: Session = Depends(get_db)
):
    link = db.query(SigningLink).filter(
        SigningLink.token == token,
        SigningLink.expires_at > datetime.utcnow(),
        SigningLink.is_used == False
    ).first()

    if not link:
        raise HTTPException(status_code=404, detail="Signing link not found or expired")

    document = db.query(Document).filter(Document.id == link.document_id).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    return FileResponse(
        path=document.filepath,
        filename=document.filename,
        media_type="application/pdf",
    )

