from services.database import engine, Base
from models.user import User
from fastapi import FastAPI

Base.metadata.create_all(bind = engine)

app = FastAPI()

