from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
import os

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl = "/auth/login")

def get_current_user(
    token: str = Depends(oauth2_scheme)
) -> str:

    payload = jwt.decode(token, SECRET_KEY, algorithms = [ALGORITHM])

    email: str = payload.get("sub")

    return email