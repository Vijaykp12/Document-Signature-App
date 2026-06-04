from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from services.database import get_db
from models.user import User
from schemas.user import UserRegister, UserLogin
from utils.security import hash_password, verify_password
from utils.jwt_handler import create_access_token
from middleware.auth import get_current_user

app = FastAPI()

@app.post("/register")
def register(user: UserRegister, db: Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code = 400, detail = "Email already registered")

    new_user = User(
        name = user.name,
        email = user.email,
        password = hash_password(user.password)
    )

    db.add(new_user)
    db.commit()

    return {
        "message": "User registered successfully"
    }


@app.post("/login")
def login(user: UserLogin, db: Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()

    if not db_user or not verify_password(user.password, db_user.password):
        raise HTTPException(status_code = 401, detail = "Invalid email or password")

    access_token = create_access_token(data = {"sub": db_user.email})

    return {
        "access_token" : access_token,
        "token_type" : "bearer"
    }

@app.get("/profile")
def profile(current_user: str = Depends(get_current_user), db: Depends(get_db)):
    user = db.query(User).filter(User.email == current_user).first()

    if not user:
        raise HTTPException(status_code = 404, detail = "User not found")

    return {
        "name": user.name,
        "email": user.email
    }
