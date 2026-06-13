from pydantic import BaseModel

class SignatureCreate(BaseModel):
    document_id: int
    x: float
    y: float
    page: int

class SignatureUpdate(BaseModel):
    x: float
    y: float
    page: int

class PublicSignatureCreate(BaseModel):
    x: float
    y: float
    page: int