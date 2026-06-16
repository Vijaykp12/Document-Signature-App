from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from services.database import get_db
from middleware.auth import get_current_user
from models.user import User
from services.audit_service import create_audit_log

router = APIRounter()

@router.get("/audit-logs")
def get_audit_logs(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
    request: Request,
):
    user = db.query(User).filter(User.email == current_user).first()

    logs = db.query(AuditLog).filter(AuditLog.user_id == user.id).order_by(AuditLog.timestamp.desc()).all()

    return [
        {
            "action": log.action,
            "document_id": log.document_id,
            "ip_address": log.ip_address,
            "timestamp": log.timestamp.isoformat()
        }
        for log in logs
    ]