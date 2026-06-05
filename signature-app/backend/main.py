from services.database import engine, Base
from models.user import User
from fastapi import FastAPI
from routers.auth import app as auth_router
from fastapi.middleware.cors import CORSMiddleware

Base.metadata.create_all(bind = engine)

app = FastAPI()

app.include_router(auth_router, prefix = "/auth")

app.add_middleware(
    CORSMiddleware,
    allow_origins = [
        "https://vigilant-enigma-7vr96xxjqv7rfpvr-3000.app.github.dev/"
    ],
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"],
)