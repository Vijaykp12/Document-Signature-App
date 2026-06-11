from sqlalchemy import Column, Integer, String, ForeignKey, Boolean
from services.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    filepath = Column(String, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"))
    thumbnail_path = Column(String, nullable=True)
    signed_filepath = Column(String, nullable=True)
    is_signed = Column(Boolean, default=False)

