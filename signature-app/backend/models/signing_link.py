from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean, DateTime
from services.database import Base

class SigningLink(Base):
    __tablename__ = "SigningLinks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    token = Column(String, unique=True, nullable=False)
    signer_email = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)  # Store as UNIX timestamp
    is_used = Column(Boolean, nullable=False, default=False)
    status = Column(String, nullable=False, default="pending")  # "pending", "signed", "rejected"
    rejection_reason = Column(String, nullable=True)