from sqlalchemy import Column, String, Integer, ForeignKey, Float
from services.database import Base

class Signature(Base):
    __tablename__ = "signatures"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    page = Column(Integer, nullable=False)
    x = Column(Float, nullable=False)
    y = Column(Float, nullable=False)
    status = Column(String, nullable=False, default="pending")
    text = Column(String, nullable=True)
    font = Column(String, nullable=True)
    color = Column(String, nullable=True)