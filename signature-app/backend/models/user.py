from sqlalchemy import Column, String, Integer
from services.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key = True, index = True)
    name = Column(String, nullable = False)
    email = Column(String, unique = True, nullable = False)
    password = Column(String, nullable = False)

