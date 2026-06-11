import os

from fastapi import HTTPException

from models.document import Document
from models.signature import Signature
from models.user import User

from services.pdf_service import (
    save_pdf,
    generate_signed_pdf,
)

from services.thumbnail_service import (
    generate_thumbnail,
)


def upload_document_service(
    file,
    current_user,
    db,
):
    saved_pdf = None
    thumbnail = None

    try:
        saved_pdf = save_pdf(file)

        thumbnail = generate_thumbnail(
            saved_pdf
        )

        user = db.query(User).filter(
            User.email == current_user
        ).first()

        document = Document(
            filename=file.filename,
            filepath=saved_pdf,
            thumbnail_path=thumbnail,
            owner_id=user.id,
        )

        db.add(document)

        db.commit()

        db.refresh(document)

        return document

    except Exception:
        db.rollback()

        if saved_pdf and os.path.exists(saved_pdf):
            os.remove(saved_pdf)

        if thumbnail and os.path.exists(thumbnail):
            os.remove(thumbnail)

        raise HTTPException(
            status_code=500,
            detail="Failed to upload document"
        )


def generate_signed_document_service(
    document_id,
    current_user,
    db,
):
    user = db.query(User).filter(
        User.email == current_user
    ).first()

    document = db.query(Document).filter(
        Document.id == document_id,
        Document.owner_id == user.id,
    ).first()

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found",
        )

    signatures = db.query(Signature).filter(
        Signature.document_id == document.id
    ).all()

    if not signatures:
        raise HTTPException(
            status_code=400,
            detail="No signatures found",
        )

    signed_path = None

    try:
        signed_path = generate_signed_pdf(
            document.filepath,
            signatures,
        )

        document.signed_filepath = signed_path
        document.is_signed = True

        db.commit()

        return document

    except Exception:
        db.rollback()

        if (
            signed_path
            and os.path.exists(signed_path)
        ):
            os.remove(signed_path)

        raise HTTPException(
            status_code=500,    
            detail="Failed to generate signed document",
        )   




def delete_document_service(
    document_id: int,
    current_user: str,
    db,
):
    user = db.query(User).filter(
        User.email == current_user
    ).first()

    document = db.query(Document).filter(
        Document.id == document_id,
        Document.owner_id == user.id,
    ).first()

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found",
        )

    try:
        # Delete original PDF
        if (
            document.filepath
            and os.path.exists(document.filepath)
        ):
            os.remove(document.filepath)

        # Delete thumbnail
        if (
            document.thumbnail_path
            and os.path.exists(document.thumbnail_path)
        ):
            os.remove(document.thumbnail_path)

        # Delete signed PDF
        if (
            document.signed_filepath
            and os.path.exists(document.signed_filepath)
        ):
            os.remove(document.signed_filepath)

        # Delete signatures
        db.query(Signature).filter(
            Signature.document_id == document.id
        ).delete()

        # Delete document row
        db.delete(document)

        db.commit()

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to delete document",
        )