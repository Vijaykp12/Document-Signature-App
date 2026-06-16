from models.audit_log import AuditLog

def create_audit_log(
    db: Session = Depends(get_db),
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