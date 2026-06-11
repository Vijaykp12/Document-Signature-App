from jose import jwt, JWTError
from datetime import datetime, timedelta
import os

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))

if not SECRET_KEY or not ALGORITHM or not ACCESS_TOKEN_EXPIRE_MINUTES:
    raise RuntimeError("Missing JWT configuration in environment variables")

def create_access_token(data: dict) -> str:
    payload = data.copy()

    expire = datetime.utcnow() + timedelta(minutes = ACCESS_TOKEN_EXPIRE_MINUTES)
    payload.update({"exp" : expire})

    return jwt.encode(payload, SECRET_KEY, algorithm = ALGORITHM)
