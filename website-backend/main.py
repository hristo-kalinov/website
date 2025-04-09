from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File, Body
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, constr
from typing import Optional
import mysql.connector
from mysql.connector import Error
from passlib.context import CryptContext
from datetime import datetime, timedelta
import jwt
from jwt import PyJWTError
import os
import shutil
import logging
from datetime import datetime, timedelta
import secrets
JWT_APP_ID = "your_app_id"  # set this in your .env or config
JWT_APP_SECRET = "your_strong_secret_key"
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 60
logger = logging.getLogger(__name__)

# Pydantic models
class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    user_type: Optional[str] = None

class UserInDB(BaseModel):
    id: int
    email: str
    password_hash: str
    user_type: str  # 'tutor' or 'student'
    first_name: str
    last_name: str
    profile_picture_url: Optional[str] = None
    balance: float = 0.0
    is_active: bool = True
    created_at: datetime
    updated_at: datetime
    last_login_at: Optional[datetime] = None
    
    # Tutor-specific fields (optional)
    subject: Optional[str] = None
    profile_title: Optional[str] = None
    bio: Optional[str] = None
    hourly_rate: Optional[float] = None
    video_intro_url: Optional[str] = None
    verification_status: Optional[str] = None
    rating: Optional[float] = None
    total_reviews: Optional[int] = None

    class Config:
        from_attributes = True

class BioUpdate(BaseModel):
    bio: str

# Add these Pydantic models
class Tutor(BaseModel):
    id: int
    name: str
    subject: str
    rating: float
    price: float
    image: str
    description: str

class TutorSearchFilters(BaseModel):
    search_term: Optional[str] = None
    subject: Optional[str] = None
    max_price: Optional[float] = None
    min_rating: Optional[float] = None

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'database': 'website_db',
    'user': 'root',
    'password': 'amsterdam'
}

# Security configurations
SECRET_KEY = "your-secret-key-here"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

# Ensure the uploads directory exists
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Serve the uploads folder
app.mount("/uploads", StaticFiles(directory=UPLOAD_FOLDER), name="uploads")
# Database connection
def get_db_connection():
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except Error as e:
        raise HTTPException(status_code=500, detail="Database connection error")

# Authentication functions
def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta if expires_delta else timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_user(email: str) -> Optional[UserInDB]:
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # Check tutors table first
        cursor.execute("""
            SELECT *, 'tutor' as user_type FROM tutors 
            WHERE email = %s
        """, (email,))
        tutor = cursor.fetchone()
        if tutor:
            return UserInDB(**tutor)

        # Check students table if not found in tutors
        cursor.execute("""
            SELECT *, 'student' as user_type FROM students 
            WHERE email = %s
        """, (email,))
        student = cursor.fetchone()
        if student:
            return UserInDB(**student)
        
        return None
    finally:
        cursor.close()
        conn.close()

async def authenticate_user(email: str, password: str):
    user = await get_user(email)
    if not user or not verify_password(password, user.password_hash):
        return False
    return user

async def get_current_user(token: str = Depends(oauth2_scheme)):    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])        
        email = payload.get("sub")
        user_type = payload.get("user_type")
        
        if not email or not user_type:
            print("ERROR: Missing email/user_type in token", flush=True)
            raise HTTPException(status_code=401, detail="Invalid token payload")
            
        user = await get_user(email)
        
        if not user:
            print(f"ERROR: User not found for email: {email}", flush=True)
            raise HTTPException(status_code=401, detail="User not found")
            
        return user
        
    except PyJWTError as e:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")

async def get_current_active_user(current_user: UserInDB = Depends(get_current_user)):
    return current_user

# Endpoints
@app.post("/login", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    access_token = create_access_token(
        data={"sub": user.email, "user_type": user.user_type},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/register")
async def register_user(user_data: dict):
    # Validate input data
    required_fields = ['email', 'password', 'first_name', 'last_name', 'user_type']
    if not all(field in user_data for field in required_fields):
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    # Check if user exists
    existing_user = await get_user(user_data['email'])
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user_data['password'])
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        if user_data['user_type'] == 'tutor':
            cursor.execute("""
                INSERT INTO tutors 
                (email, password_hash, first_name, last_name, subject, hourly_rate) 
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                user_data['email'], 
                hashed_password, 
                user_data['first_name'], 
                user_data['last_name'],
                user_data.get('subject', ''),
                user_data.get('hourly_rate', 0.0)
            ))
        else:
            cursor.execute("""
                INSERT INTO students 
                (email, password_hash, first_name, last_name) 
                VALUES (%s, %s, %s, %s)
            """, (
                user_data['email'], 
                hashed_password, 
                user_data['first_name'], 
                user_data['last_name']
            ))
        
        conn.commit()
        return {"message": "User created successfully"}
    except Error as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()
@app.get("/users/me")
async def read_users_me(current_user: UserInDB = Depends(get_current_active_user)):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(f"SELECT * FROM {current_user.user_type}s WHERE id = %s", (current_user.id,))
        user_data = cursor.fetchone()
        if not user_data:
            raise HTTPException(status_code=404, detail="User details not found")
        
        # Remove sensitive data
        user_data.pop('password_hash', None)
        
        # Add user type
        user_data['user_type'] = current_user.user_type
        
        return user_data
    finally:
        cursor.close()
        conn.close()

@app.post("/upload-profile-picture/")
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: UserInDB = Depends(get_current_active_user)
):
    # Generate unique filename using timestamp and original filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_")
    filename = timestamp + file.filename
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    
    # Save the file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Update the database with the new profile picture URL
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            f"UPDATE {current_user.user_type}s SET profile_picture_url = %s WHERE id = %s",
            (f"/uploads/{filename}", current_user.id)
        )
        conn.commit()
        return JSONResponse({"file_url": f"/uploads/{filename}"})
    except Error as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.get("/balance")
async def get_user_balance(current_user: UserInDB = Depends(get_current_active_user)):
    return {"balance": current_user.balance}
@app.get("/users/bio")
async def get_own_bio(current_user: UserInDB = Depends(get_current_active_user)):
    if current_user.user_type != "tutor":
        raise HTTPException(status_code=403, detail="Only tutors have a bio")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT bio FROM tutors WHERE id = %s", (current_user.id,))
        result = cursor.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Tutor not found")
        return {"bio": result["bio"]}
    finally:
        cursor.close()
        conn.close()


@app.post("/users/change_bio")
async def change_own_bio(
    bio_data: BioUpdate,
    current_user: UserInDB = Depends(get_current_active_user)
):
    print("Hi", flush=True)
    logger.info(f"User type: {current_user.user_type}") 
    if current_user.user_type != "tutor":
        raise HTTPException(status_code=403, detail="Only tutors can update their bio")

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE tutors SET bio = %s WHERE id = %s", (bio_data.bio, current_user.id))
        conn.commit()
        return {"message": "Bio updated successfully"}
    except Error as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()
@app.get("/users/bio")
async def get_own_bio(current_user: UserInDB = Depends(get_current_active_user)):
    if current_user.user_type != "tutor":
        raise HTTPException(status_code=403, detail="Only tutors have a bio")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT bio FROM tutors WHERE id = %s", (current_user.id,))
        result = cursor.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Tutor not found")
        return {"bio": result["bio"]}
    finally:
        cursor.close()
        conn.close()
@app.post("/generate-jitsi-token")
async def generate_jitsi_token(
    current_user: UserInDB = Depends(get_current_active_user)
):
    room = secrets.token_hex(16)  # Generate a random room name (removed trailing comma)
    now = datetime.utcnow() + timedelta(hours=3)
    print(now + timedelta(minutes=JWT_EXPIRE_MINUTES), flush=True)
    expire = now + timedelta(minutes=JWT_EXPIRE_MINUTES)
    
    payload = {
        "typ": "JWT",
        "alg": "HS256",
        "aud": JWT_APP_ID,
        "iss": JWT_APP_ID,
        "sub": "*",
        "room": "*",
        "iat": int(now.timestamp()),  # Issued At: Time the token was generated
        "nbf": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=JWT_EXPIRE_MINUTES)).timestamp()),
        "context": {
            "user": {
            "name": f"{current_user.first_name}"
            }
        }
    }

    token = jwt.encode(payload, JWT_APP_SECRET, algorithm=JWT_ALGORITHM)
    print(payload, flush=True)
    return {"jitsi_token": token, "room": room}

from typing import List, Optional
from fastapi import Query

# Add these endpoints to your FastAPI app
@app.get("/tutors/subjects", response_model=List[str])
async def get_all_subjects():
    """Return all available subjects for tutors"""
    return [
        'Математика',
        'Български език',
        'Английски език',
        'История',
        'География',
        'Биология',
        'Химия',
        'Физика',
        'Информатика',
        'Немски език',
        'Френски език',
        'Испански език',
        'Италиански език',
        'Руски език',
        'Литература',
        'Философия',
        'Психология',
        'Музика',
        'Изобразително изкуство',
        'Програмиране',
        'Web дизайн',
        'Счетоводство',
        'Икономика',
        'Статистика'
    ]

@app.get("/tutors/search", response_model=List[Tutor])
async def search_tutors(
    search_term: Optional[str] = Query(None, description="Search by name or subject"),
    subject: Optional[str] = Query(None, description="Filter by subject"),
    max_price: Optional[float] = Query(100, description="Maximum hourly rate"),
    min_rating: Optional[float] = Query(4.0, description="Minimum tutor rating"),
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Search for tutors with optional filters
    
    Returns a list of tutors matching the search criteria
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Base query
        query = """
            SELECT 
                t.id,
                CONCAT(t.first_name, ' ', t.last_name) as name,
                t.subject,
                t.rating,
                t.hourly_rate as price,
                COALESCE(t.profile_picture_url, '/uploads/default_pfp.webp') as image,
                COALESCE(t.bio, '') as description
            FROM tutors t
            WHERE t.is_active = TRUE
        """
        
        # Add filters
        params = []
        conditions = []
        
        if search_term:
            conditions.append("""
                (CONCAT(t.first_name, ' ', t.last_name) LIKE %s 
                OR t.subject LIKE %s)
            """)
            params.extend([f"%{search_term}%", f"%{search_term}%"])
        
        if subject:
            conditions.append("t.subject = %s")
            params.append(subject)
        
        if max_price:
            conditions.append("t.hourly_rate <= %s")
            params.append(max_price)
        
        if min_rating:
            conditions.append("t.rating >= %s")
            params.append(min_rating)
        
        if conditions:
            query += " AND " + " AND ".join(conditions)
        
        # Add sorting (you might want to make this configurable)
        query += " ORDER BY t.rating DESC, t.hourly_rate ASC"
        
        cursor.execute(query, params)
        tutors = cursor.fetchall()
        
        return tutors
        
    except Error as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.get("/tutors/{tutor_id}", response_model=Tutor)
async def get_tutor_details(
    tutor_id: int,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Get detailed information about a specific tutor"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("""
            SELECT 
                t.id,
                CONCAT(t.first_name, ' ', t.last_name) as name,
                t.subject,
                t.rating,
                t.hourly_rate as price,
                COALESCE(t.profile_picture_url, '/uploads/default_pfp.webp') as image,
                COALESCE(t.bio, '') as description,
                t.profile_title,
                t.video_intro_url,
                t.verification_status,
                t.total_reviews
            FROM tutors t
            WHERE t.id = %s AND t.is_active = TRUE
        """, (tutor_id,))
        
        tutor = cursor.fetchone()
        if not tutor:
            raise HTTPException(status_code=404, detail="Tutor not found")
        
        return tutor
        
    except Error as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()