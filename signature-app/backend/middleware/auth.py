from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
import os

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl = "/auth/login")

def unauthorized_exception():
    return HTTPException(
        status_code = status.HTTP_401_UNAUTHORIZED,
        detail = "Could not validate credentials",
        headers = {"WWW-Authenticate": "Bearer"}
    )


def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        # Try decoding the incoming token string safely
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise unauthorized_exception()
            
        return email
    except JWTError:
        # If the token is malformed, has "Not enough segments", or is expired:
        raise unauthorized_exception()