from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, Request
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
from fastapi import Response
from services.email_service import send_signing_email
from services.audit_service import create_audit_log

router = APIRouter()

@router.post(
    "/upload",
    response_model=UploadResponse,
)
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    user = db.query(User).filter(User.email == current_user).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    document = upload_document_service(
        file,
        current_user,
        db,
    )

    create_audit_log(
        db=db,
        user_id=user.id,
        action="Uploaded document",
        document_id=document.id,
        ip_address=request.client.host,
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
    request: Request,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    user = db.query(User).filter(User.email == current_user).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    delete_document_service(
        document_id=document_id,
        current_user=current_user,
        db=db,
    )

    create_audit_log(
        db=db,
        user_id=user.id,
        action="Deleted document",
        document_id=document_id,
        ip_address=request.client.host,
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
    request: Request,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    user = db.query(User).filter(User.email == current_user).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    document = generate_signed_document_service(
        document_id,
        current_user,
        db,
    )

    create_audit_log(
        db=db,
        user_id=user.id,
        action="Generated signed document",
        document_id=document.id,
        ip_address=request.client.host,
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
    request: Request,
    db:Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
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

    frontend_url = os.getenv("FRONTEND_URL") or "http://localhost:3000"
    signing_url = (
        f"{frontend_url}/sign/{doc_token}"
    )

    try:
        send_signing_email(
            recipient=payload.signer_email,
            signing_link=signing_url,
            filename=document.filename,
        )
    except Exception as e:
        print("Failed to send signing email (this is normal in development if RESEND_API_KEY is not configured):", e)

    create_audit_log(
        db=db,
        user_id=user.id,
        action="Created Signing Link for Document",
        document_id=document.id,
        ip_address=request.client.host,
    )

    return {
        "message": "Signing link created successfully",
        "signing_link": signing_url
    }


@router.get("/public-document/preview/{token}")
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
        "status": link.status,
        "rejection_reason": link.rejection_reason,
    }


@router.get("/public-document/pdf/{token}")
def get_public_document(
    token: str,
    db: Session = Depends(get_db)
):
    link = db.query(SigningLink).filter(
        SigningLink.token == token,
        SigningLink.expires_at > datetime.utcnow()
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


@router.get("/signing-links")
def get_signing_links(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    user = db.query(User).filter(User.email == current_user).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    links_with_doc = db.query(SigningLink, Document).join(
        Document, SigningLink.document_id == Document.id
    ).filter(
        Document.owner_id == user.id
    ).all()

    return [
        {
            "id": link.id,
            "token": link.token,
            "document_id": link.document_id,
            "document_filename": doc.filename,
            "signer_email": link.signer_email,
            "expires_at": link.expires_at,
            "is_used": link.is_used,
            "status": link.status,
            "rejection_reason": link.rejection_reason
        }
        for link, doc in links_with_doc
    ]


@router.delete("/signing-link/{link_id}")
def delete_signing_link(
    link_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    user = db.query(User).filter(User.email == current_user).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    link = db.query(SigningLink).join(
        Document, SigningLink.document_id == Document.id
    ).filter(
        SigningLink.id == link_id,
        Document.owner_id == user.id
    ).first()

    if not link:
        raise HTTPException(
            status_code=404,
            detail="Signing link not found or you do not have permission"
        )

    db.delete(link)
    db.commit()

    create_audit_log(
        db=db,
        user_id=user.id,
        action=f"Deleted/Revoked signing link for recipient: {link.signer_email}",
        document_id=link.document_id,
        ip_address=request.client.host,
    )

    return {"message": "Signing link revoked and deleted successfully"}



