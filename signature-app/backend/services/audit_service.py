from models.audit_logs import AuditLog
from sqlalchemy.orm import Session
from fastapi import Depends
from services.database import get_db

def create_audit_log(
    db: Session,
    user_id=None,
    action=None,
    ip_address=None,
    document_id=None,
):
    log = AuditLog(
        user_id=user_id,
        action=action,
        document_id=document_id,
        ip_address=ip_address,
    )

    db.add(log)
    db.commit()