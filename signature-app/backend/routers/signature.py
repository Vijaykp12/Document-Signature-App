from fastapi import APIRouter
from sqlalchemy.orm import Session
from models.signature import Signature
from schemas.signature import SignatureCreate
from services.database import get_db
from middleware.auth import get_current_user
from fastapi import Depends
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

@router.delete("/{signature_id}")
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
