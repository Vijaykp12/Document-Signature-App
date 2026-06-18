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

    except Exception as e:
        db.rollback()

        from services.storage import delete_from_supabase
        if saved_pdf:
            try:
                delete_from_supabase(saved_pdf)
            except Exception:
                pass

        if thumbnail:
            try:
                delete_from_supabase(thumbnail)
            except Exception:
                pass

        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload document: {e}"
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

    except Exception as e:
        db.rollback()

        from services.storage import delete_from_supabase
        if signed_path:
            try:
                delete_from_supabase(signed_path)
            except Exception:
                pass

        raise HTTPException(
            status_code=500,    
            detail=f"Failed to generate signed document: {e}",
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
        from services.storage import delete_from_supabase

        # Delete original PDF from Supabase
        if document.filepath:
            delete_from_supabase(document.filepath)

        # Delete thumbnail from Supabase
        if document.thumbnail_path:
            delete_from_supabase(document.thumbnail_path)

        # Delete signed PDF from Supabase
        if document.signed_filepath:
            delete_from_supabase(document.signed_filepath)

        # Delete signatures
        db.query(Signature).filter(
            Signature.document_id == document.id
        ).delete()

        # Delete document row
        db.delete(document)

        db.commit()

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete document: {e}",
        )