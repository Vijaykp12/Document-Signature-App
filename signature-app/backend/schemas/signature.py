from pydantic import BaseModel
from typing import Optional

class SignatureCreate(BaseModel):
    document_id: int
    x: float
    y: float
    page: int
    text: Optional[str] = None
    font: Optional[str] = None
    color: Optional[str] = None

class SignatureUpdate(BaseModel):
    x: float
    y: float
    page: int
    text: Optional[str] = None
    font: Optional[str] = None
    color: Optional[str] = None

class PublicSignatureCreate(BaseModel):
    x: float
    y: float
    page: int
    text: Optional[str] = None
    font: Optional[str] = None
    color: Optional[str] = None


class PublicRejectPayload(BaseModel):
    reason: str