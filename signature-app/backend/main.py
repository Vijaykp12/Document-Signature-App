from services.database import engine, Base
from models.user import User
from fastapi import FastAPI
from routers.auth import app as auth_router
from routers.documents import router as document_router
from routers.signature import router as signature_router
from routers.audit_logs import router as audit_router
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

Base.metadata.create_all(bind = engine)

app = FastAPI()

app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads"
)

app.mount(
    "/thumbnails",
    StaticFiles(directory="thumbnails"),
    name="thumbnails"
)

app.mount(
    "/signed_documents",
    StaticFiles(directory="signed_documents"),
    name="signed_documents"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins = [
        "https://vigilant-enigma-7vr96xxjqv7rfpvr-3000.app.github.dev",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"],
)

app.include_router(auth_router, prefix="/auth")
app.include_router(document_router, prefix="/documents")
app.include_router(signature_router, prefix="/signatures")
app.include_router(audit_router, prefix="/audit-logs")