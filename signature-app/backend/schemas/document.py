from pydantic import BaseModel


class DocumentResponse(BaseModel):
    id: int
    filename: str
    filepath: str
    thumbnail: str | None

    class Config:
        from_attributes = True


class UploadResponse(BaseModel):
    message: str
    document_id: int
    thumbnail_url: str


class SignedDocumentResponse(BaseModel):
    message: str
    path: str

class SigningLinkCreate(BaseModel):
    document_id: int
    signer_email: str
    expires_in: int