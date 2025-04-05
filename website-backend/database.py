from sqlalchemy import create_engine
import os
from dotenv import load_dotenv

load_dotenv()

SQLALCHEMY_DATABASE_URL = f"postgresql://fastapi_user:{os.getenv('DB_PASSWORD')}@localhost/fastapi_db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)