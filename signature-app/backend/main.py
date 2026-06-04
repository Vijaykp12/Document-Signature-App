from services.database import engine, Base
from models.user import User
from fastapi import FastAPI
from routers.auth import app as auth_router

Base.metadata.create_all(bind = engine)

app = FastAPI()

app.include_router(auth_router, prefix = "/auth")

