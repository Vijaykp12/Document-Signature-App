from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.signature import Signature
from schemas.signature import SignatureCreate, SignatureUpdate, PublicSignatureCreate
from services.database import get_db
from middleware.auth import get_current_user
from models.user import User

router = APIRouter()

@router.post("/place-signature")
def place_signature(
    signature: SignatureCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):

    user = db.query(User).filter(User.email == current_user).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_signature = Signature(
        document_id = signature.document_id,
        user_id = user.id,
        page = signature.page,
        x = signature.x,
        y = signature.y,
        status = "pending"
    )

    db.add(new_signature)
    db.commit()
    db.refresh(new_signature)

    return {
        "message": "Signature placed successfully",
        "id": new_signature.id
    }

@router.get("/my-signatures")
def get_my_signatures(
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == current_user).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    signatures = db.query(Signature).filter(Signature.user_id == user.id).all()

    return [
        {
            "id": sig.id,
            "document_id": sig.document_id,
            "page": sig.page,
            "x": sig.x,
            "y": sig.y,
            "status": sig.status
        }
        for sig in signatures
    ]

@router.delete("/delete/{signature_id}")
def delete_signature(
    signature_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == current_user).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    signature = db.query(Signature).filter(Signature.id == signature_id, Signature.user_id == user.id).first()
    if not signature:
        raise HTTPException(status_code=404, detail="Signature not found")

    db.delete(signature)
    db.commit()

    return {
        "message": "Signature deleted successfully"
    }

@router.put("/update-signature/{signature_id}")
def update_signature(
    signature_id: int,
    signature: SignatureUpdate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    user = db.query(User).filter(
        User.email == current_user
    ).first()

    existing_signature = db.query(Signature).filter(
        Signature.id == signature_id,
        Signature.user_id == user.id
    ).first()

    if not existing_signature:
        raise HTTPException(
            status_code=404,
            detail="Signature not found"
        )

    existing_signature.x = signature.x
    existing_signature.y = signature.y
    existing_signature.page = signature.page

    db.commit()
    db.refresh(existing_signature)

    return {
        "message": "Signature updated successfully"
    }

@router.post("/public-sign/{token}")
def public_sign(
    token: str,
    signature: PublicSignatureCreate,
    db: Session = Depends(get_db)
):
    link = db.query(SigningLink).filter(
        SigningLink.token == token,
        SigningLink.expires_at > datetime.utcnow(),
        SigningLink.is_used == False
    ).first()

    if not link:
        raise HTTPException(
            status_code=404,
            detail="Signing link expired or invalid"
        )

    new_signature = Signature(
        document_id=link.document_id,
        user_id=None,          # external signer
        page=signature.page,
        x=signature.x,
        y=signature.y,
        status="completed"
    )

    db.add(new_signature)

    link.is_used = True

    db.commit()
    db.refresh(new_signature)

    return {
        "message": "Document signed successfully"
    }