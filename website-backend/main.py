from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, status, UploadFile, File, Body
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, constr
from typing import Optional
import mysql.connector
from mysql.connector import Error
from passlib.context import CryptContext
import jwt
from jwt import PyJWTError
import os
import shutil
import logging
from datetime import datetime, timedelta
import secrets
import json
from fastapi import WebSocket, WebSocketDisconnect
from fastapi import Query
import uuid

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: str, user_id: int):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_text(message)

    async def broadcast(self, message: str, exclude_user_id: int = None):
        for user_id, connection in self.active_connections.items():
            if user_id != exclude_user_id:
                await connection.send_text(message)
manager = ConnectionManager()

class MessageBase(BaseModel):
    content: str

class MessageCreate(MessageBase):
    pass

class Message(MessageBase):
    id: int
    conversation_id: int
    sender_id: int
    sent_at: datetime
    is_read: bool

    class Config:
        from_attributes = True

class Conversation(BaseModel):
    id: int
    tutor_id: int
    student_id: int
    created_at: datetime
    updated_at: datetime
    last_message: Optional[str] = None  # if used
    unread_count: Optional[int] = None
    last_message_content: Optional[str] = None
    last_message_time: Optional[datetime] = None

    # Fields from JOINs
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    image: Optional[str] = None

JWT_APP_ID = "your_app_id"
JWT_APP_SECRET = "your_strong_secret_key"
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 120
JITSI_DOMAIN = "localhost"  # Replace with your Jitsi domain
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
    public_id: str
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

class Tutor(BaseModel):
    public_id: str
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

class AvailabilitySlot(BaseModel):
    day: int  # 0-6 (Monday-Sunday)
    slots: list[int]  # List of 30-minute slot indices (0-47)

class AvailabilityUpdate(BaseModel):
    availability: list[AvailabilitySlot]
class AvailabilityRequest(BaseModel):
    tutor_id: str

# Request model for booking
class BookLessonRequest(BaseModel):
    student_id: int
    day_of_week: int      # From frontend's selectedStart.day
    time_slot: int        # From selectedStart.slot
    duration: int         # From selectedDuration
    frequency: str        # "once" or "weekly"


# Initialize FastAPI app
app = FastAPI()

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await manager.connect(websocket, user_id)
    try:
        while True:
            await websocket.receive_text()  # keep alive
    except WebSocketDisconnect:
        await manager.disconnect(user_id)

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
    'password': 'amsterdam',
    'use_pure': True
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

def get_db_connection():
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except Error as e:
        raise HTTPException(status_code=500, detail="Database connection error")

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
        cursor.execute("SELECT * FROM users WHERE email = %s", (email.lower(),))  # Case-insensitive
        user = cursor.fetchone()
        if user:
            return UserInDB(**user)
        return None
    except Exception as e:
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


def get_next_scheduled_datetime(day_of_week, time_slot):
    now = datetime.now()
    today_weekday = now.weekday()  # Monday=0 to Sunday=6

    # MySQL convention might use Sunday=0, so you may need to map it:
    mysql_to_python_day_map = {0: 6, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5}
    target_weekday = mysql_to_python_day_map.get(day_of_week, day_of_week)

    days_ahead = (target_weekday - today_weekday) % 7
    if days_ahead == 0:
        # Same day: only schedule if time is in the future
        slot_hour = time_slot // 2
        slot_minute = (time_slot % 2) * 30
        lesson_time_today = now.replace(hour=slot_hour, minute=slot_minute, second=0, microsecond=0)
        if lesson_time_today > now:
            return lesson_time_today
        else:
            days_ahead = 7  # Push to next week

    next_date = now + timedelta(days=days_ahead)
    slot_hour = time_slot // 2
    slot_minute = (time_slot % 2) * 30
    scheduled_at = next_date.replace(hour=slot_hour, minute=slot_minute, second=0, microsecond=0)

    return scheduled_at

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
    required_fields = ['email', 'password', 'first_name', 'last_name', 'user_type']
    missing_fields = [field for field in required_fields if field not in user_data]
    if missing_fields:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required fields: {', '.join(missing_fields)}"
        )
    
    if user_data['user_type'] == 'tutor':
        tutor_fields = ['subject', 'title', 'description', 'price']
        missing_tutor = [field for field in tutor_fields if field not in user_data]
        if missing_tutor:
            raise HTTPException(
                status_code=400,
                detail=f"Missing tutor fields: {', '.join(missing_tutor)}"
            )

    hashed_password = get_password_hash(user_data['password'])
    public_id = str(uuid.uuid4())  # Generate a new UUID for public_id
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        if user_data['user_type'] == 'tutor':
            cursor.execute("""
                INSERT INTO users 
                (public_id, email, password_hash, first_name, last_name, user_type,
                subject, profile_title, bio, hourly_rate, profile_picture_url, 
                verification_status, rating, total_reviews, balance, is_active)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                public_id,
                user_data['email'],
                hashed_password,
                user_data['first_name'],
                user_data['last_name'],
                'tutor',
                user_data['subject'],
                user_data['title'],
                user_data['description'],
                float(user_data['price']),
                '/uploads/default_pfp.webp',
                'unverified',
                0.00,
                0,
                0.00,
                True
            ))
        else:
            cursor.execute("""
                INSERT INTO users 
                (public_id, email, password_hash, first_name, last_name, user_type, profile_picture_url) 
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                public_id,
                user_data['email'], 
                hashed_password, 
                user_data['first_name'], 
                user_data['last_name'],
                'student',
                '/uploads/default_pfp.webp'  # Default profile picture for students
            ))

        conn.commit()
        return {"message": "User created successfully", "public_id": public_id}
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
        cursor.execute("SELECT * FROM users WHERE id = %s", (current_user.id,))
        user_data = cursor.fetchone()
        if not user_data:
            raise HTTPException(status_code=404, detail="User details not found")
        
        # Remove sensitive data
        user_data.pop('password_hash', None)
        return user_data
    finally:
        cursor.close()
        conn.close()

@app.post("/upload-profile-picture/")
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: UserInDB = Depends(get_current_active_user)
):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_")
    filename = timestamp + file.filename
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE users SET profile_picture_url = %s WHERE id = %s",
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
        cursor.execute("SELECT bio FROM users WHERE id = %s AND user_type = 'tutor'", (current_user.id,))
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
    if current_user.user_type != "tutor":
        raise HTTPException(status_code=403, detail="Only tutors can update their bio")

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE users SET bio = %s WHERE id = %s", (bio_data.bio, current_user.id))
        conn.commit()
        return {"message": "Bio updated successfully"}
    except Error as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.post("/generate-jitsi-token")
async def generate_jitsi_token(
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Generates a Jitsi token using the user's public_id"""
    try:
        # 1. Generate random room ID
        room = secrets.token_hex(16)
        
        # 2. Calculate timestamps
        now = datetime.utcnow()
        expire = now + timedelta(minutes=JWT_EXPIRE_MINUTES)
        
        # 3. Create payload with public_id
        payload = {
            "typ": "JWT",
            "alg": "HS256",
            "aud": JWT_APP_ID,
            "iss": JWT_APP_ID,
            "sub": current_user.public_id,  # Using public_id here
            "room": room,
            "iat": int(now.timestamp()),
            "nbf": int(now.timestamp()),
            "exp": int(expire.timestamp()),
            "context": {
                "user": {
                    "name": current_user.first_name or "Participant",
                    "id": current_user.public_id  # Additional identifier
                }
            }
        }

        # 4. Generate token
        token = jwt.encode(payload, JWT_APP_SECRET, algorithm=JWT_ALGORITHM)
        
        return {
            "jitsi_token": token,
            "room": room,
            "expires_at": expire.isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Token generation failed: {str(e)}"
        )

@app.get("/tutors/subjects", response_model=list[str])
async def get_all_subjects():
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

@app.get("/tutors/search", response_model=list[Tutor])
async def search_tutors(
    search_term: Optional[str] = Query(None, description="Search by name or subject"),
    subject: Optional[str] = Query(None, description="Filter by subject"),
    max_price: Optional[float] = Query(100, description="Maximum hourly rate"),
    current_user: UserInDB = Depends(get_current_active_user)
):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        query = """
            SELECT 
                public_id,
                CONCAT(first_name, ' ', last_name) as name,
                subject,
                rating,
                hourly_rate as price,
                COALESCE(profile_picture_url, '/uploads/default_pfp.webp') as image,
                COALESCE(bio, '') as description
            FROM users
            WHERE is_active = TRUE AND user_type = 'tutor'
        """
        
        params = []
        conditions = []
        
        if search_term:
            conditions.append("""
                (CONCAT(first_name, ' ', last_name) LIKE %s 
                OR subject LIKE %s)
            """)
            params.extend([f"%{search_term}%", f"%{search_term}%"])
        
        if subject:
            conditions.append("subject = %s")
            params.append(subject)
        
        if max_price:
            conditions.append("hourly_rate <= %s")
            params.append(max_price)
        
        if conditions:
            query += " AND " + " AND ".join(conditions)
        
        query += " ORDER BY hourly_rate ASC"
        
        cursor.execute(query, params)
        tutors = cursor.fetchall()
        return tutors
        
    except Error as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.get("/tutors/{public_id}", response_model=Tutor)
async def get_tutor_details(
    public_id: str,
    current_user: UserInDB = Depends(get_current_active_user)
):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT 
                public_id,
                CONCAT(first_name, ' ', last_name) as name,
                subject,
                rating,
                hourly_rate as price,
                COALESCE(profile_picture_url, '/uploads/default_pfp.webp') as image,
                COALESCE(bio, '') as description,
                profile_title,
                video_intro_url,
                verification_status,
                total_reviews
            FROM users
            WHERE public_id = %s AND is_active = TRUE AND user_type = 'tutor'
        """, (public_id,))
        
        tutor = cursor.fetchone()
        if not tutor:
            raise HTTPException(status_code=404, detail="Tutor not found")
        
        return tutor

    except Error as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.post("/conversations/start/{public_id}", response_model=Conversation)
async def start_conversation(
    public_id: str,
    current_user: UserInDB = Depends(get_current_active_user)
):
    if current_user.user_type != "student":
        raise HTTPException(status_code=403, detail="Only students can start conversations")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # First get the tutor's real ID from their public_id
        cursor.execute("""
            SELECT id FROM users 
            WHERE public_id = %s AND user_type = 'tutor'
        """, (public_id,))
        tutor = cursor.fetchone()
        
        if not tutor:
            raise HTTPException(status_code=404, detail="Tutor not found")
        
        tutor_id = tutor['id']
        
        # Check if conversation already exists
        cursor.execute("""
            SELECT id FROM conversations 
            WHERE tutor_id = %s AND student_id = %s
        """, (tutor_id, current_user.id))
        existing = cursor.fetchone()
        
        if existing:
            cursor.execute("""
                SELECT * FROM conversations 
                WHERE id = %s
            """, (existing['id'],))
            return cursor.fetchone()
        
        # Create new conversation
        cursor.execute("""
            INSERT INTO conversations (tutor_id, student_id)
            VALUES (%s, %s)
        """, (tutor_id, current_user.id))
        conn.commit()
        
        cursor.execute("""
            SELECT * FROM conversations 
            WHERE id = LAST_INSERT_ID()
        """)
        return cursor.fetchone()
        
    except Error as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.get("/conversations", response_model=list[Conversation])
async def get_user_conversations(
    current_user: UserInDB = Depends(get_current_active_user)
):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        if current_user.user_type == "tutor":
            cursor.execute("""
                SELECT c.*, 
                       (SELECT COUNT(*) FROM messages m 
                        WHERE m.conversation_id = c.id AND m.is_read = FALSE 
                        AND m.sender_id = c.student_id) as unread_count,
                       (SELECT m.content FROM messages m 
                        WHERE m.conversation_id = c.id 
                        ORDER BY m.sent_at DESC LIMIT 1) as last_message_content,
                       (SELECT m.sent_at FROM messages m 
                        WHERE m.conversation_id = c.id 
                        ORDER BY m.sent_at DESC LIMIT 1) as last_message_time,
                       u.first_name as first_name,
                       u.last_name as last_name,
                       u.profile_picture_url as image
                FROM conversations c
                JOIN users u ON c.student_id = u.id
                WHERE c.tutor_id = %s
                ORDER BY c.updated_at DESC
            """, (current_user.id,))
        else:
            cursor.execute("""
                SELECT c.*, 
                       (SELECT COUNT(*) FROM messages m 
                        WHERE m.conversation_id = c.id AND m.is_read = FALSE 
                        AND m.sender_id = c.tutor_id) as unread_count,
                       (SELECT m.content FROM messages m 
                        WHERE m.conversation_id = c.id 
                        ORDER BY m.sent_at DESC LIMIT 1) as last_message_content,
                       (SELECT m.sent_at FROM messages m 
                        WHERE m.conversation_id = c.id 
                        ORDER BY m.sent_at DESC LIMIT 1) as last_message_time,
                       u.first_name as first_name,
                       u.last_name as last_name,
                       u.profile_picture_url as image
                FROM conversations c
                JOIN users u ON c.tutor_id = u.id
                WHERE c.student_id = %s
                ORDER BY c.updated_at DESC
            """, (current_user.id,))
        
        conversations = cursor.fetchall()
        return conversations

    except Error as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.get("/conversations/{conversation_id}/messages", response_model=list[Message])
async def get_conversation_messages(
    conversation_id: int,
    current_user: UserInDB = Depends(get_current_active_user)
):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("""
            SELECT * FROM conversations 
            WHERE id = %s AND (tutor_id = %s OR student_id = %s)
        """, (conversation_id, current_user.id, current_user.id))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        cursor.execute("""
            SELECT * FROM messages 
            WHERE conversation_id = %s
            ORDER BY sent_at ASC
        """, (conversation_id,))
        messages = cursor.fetchall()
        
        # Mark messages as read
        if current_user.user_type == "tutor":
            sender_condition = "sender_id = (SELECT student_id FROM conversations WHERE id = %s)"
        else:
            sender_condition = "sender_id = (SELECT tutor_id FROM conversations WHERE id = %s)"
        
        cursor.execute(f"""
            UPDATE messages 
            SET is_read = TRUE 
            WHERE conversation_id = %s AND is_read = FALSE AND {sender_condition}
        """, (conversation_id, conversation_id))
        conn.commit()
        
        return messages
        
    except Error as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.post("/conversations/{conversation_id}/messages", response_model=Message)
async def send_message(
    conversation_id: int,
    message: MessageCreate,
    current_user: UserInDB = Depends(get_current_active_user)
):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("""
            SELECT * FROM conversations 
            WHERE id = %s AND (tutor_id = %s OR student_id = %s)
        """, (conversation_id, current_user.id, current_user.id))
        conv = cursor.fetchone()
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        recipient_id = conv['tutor_id'] if current_user.user_type == 'student' else conv['student_id']
        
        cursor.execute("""
            INSERT INTO messages (conversation_id, sender_id, content)
            VALUES (%s, %s, %s)
        """, (conversation_id, current_user.id, message.content))
        
        cursor.execute("""
            UPDATE conversations 
            SET updated_at = NOW() 
            WHERE id = %s
        """, (conversation_id,))
        
        conn.commit()
        
        cursor.execute("""
            SELECT * FROM messages 
            WHERE id = LAST_INSERT_ID()
        """)
        new_message = cursor.fetchone()
        
        message_data = {
            "type": "new_message",
            "conversation_id": conversation_id,
            "message": {
                "id": new_message['id'],
                "content": new_message['content'],
                "sender_id": new_message['sender_id'],
                "sent_at": new_message['sent_at'].isoformat(),
                "is_read": new_message['is_read']
            }
        }
        
        await manager.send_personal_message(
            json.dumps(message_data),
            recipient_id
        )
        
        return new_message
        
    except Error as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.get("/conversations/unread-count")
async def get_unread_count(
    current_user: UserInDB = Depends(get_current_active_user)
):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        if current_user.user_type == "tutor":
            cursor.execute("""
                SELECT COUNT(*) as count
                FROM messages m
                JOIN conversations c ON m.conversation_id = c.id
                WHERE c.tutor_id = %s AND m.sender_id = c.student_id AND m.is_read = FALSE
            """, (current_user.id,))
        else:
            cursor.execute("""
                SELECT COUNT(*) as count
                FROM messages m
                JOIN conversations c ON m.conversation_id = c.id
                WHERE c.student_id = %s AND m.sender_id = c.tutor_id AND m.is_read = FALSE
            """, (current_user.id,))
        
        result = cursor.fetchone()
        return {"unread_count": result['count']}
        
    except Error as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()
@app.post("/save-availability")
async def save_availability(
    availability_data: AvailabilityUpdate,
    current_user: UserInDB = Depends(get_current_active_user)
):
    if current_user.user_type != "tutor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only tutors can set availability"
        )

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Step 1: Fetch existing availability
        cursor.execute(
            "SELECT day_of_week, time_slot FROM tutor_availability WHERE tutor_id = %s",
            (current_user.id,)
        )
        existing_slots = set(cursor.fetchall())  # Set of tuples (day, slot)

        # Step 2: Build new slots set
        new_slots = set()
        for day_slots in availability_data.availability:
            for slot in day_slots.slots:
                if not (0 <= day_slots.day <= 6 and 0 <= slot <= 47):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Invalid slot: day {day_slots.day}, slot {slot}"
                    )
                new_slots.add((day_slots.day, slot))

        # Step 3: Determine which slots to insert and delete
        slots_to_add = new_slots - existing_slots
        slots_to_remove = existing_slots - new_slots

        # Step 4: Perform deletions
        for day, slot in slots_to_remove:
            cursor.execute(
                """
                DELETE FROM tutor_availability 
                WHERE tutor_id = %s AND day_of_week = %s AND time_slot = %s
                """,
                (current_user.id, day, slot)
            )

        # Step 5: Perform insertions
        for day, slot in slots_to_add:
            cursor.execute(
                """
                INSERT INTO tutor_availability 
                (tutor_id, day_of_week, time_slot, is_available)
                VALUES (%s, %s, %s, TRUE)
                """,
                (current_user.id, day, slot)
            )

        conn.commit()
        return {"message": "Availability updated successfully"}

    except Error as e:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error"
        )
    finally:
        cursor.close()
        conn.close()

@app.post("/get-availability")
async def get_availability(
    tutor: AvailabilityRequest
):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            "SELECT id FROM users WHERE public_id = %s",
            (tutor.tutor_id,)
        )
        result = cursor.fetchone()
        id = result['id']
        cursor.execute(
            "SELECT day_of_week, time_slot FROM tutor_availability WHERE tutor_id = %s AND is_available = 1 ORDER BY day_of_week, time_slot;",
            (id,)
        )
        slots = cursor.fetchall()
        return {"availability": slots}

    except Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error"
        )
    finally:
        cursor.close()
        conn.close()

def get_student_id_from_token(token: str):
    try:
        payload = jwt.decode(token, "your_strong_secret_key", algorithms=["HS256"])
        return payload.get("sub")  # Assuming user ID is in 'sub'
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")


# Endpoint to handle bookings
@app.post("/book-lesson/{tutor_id}")
async def book_lesson(
    tutor_id: str,
    request: BookLessonRequest,
):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # Get tutor DB ID
        cursor.execute("SELECT id FROM users WHERE public_id = %s", (tutor_id,))
        tutor = cursor.fetchone()
        if not tutor:
            raise HTTPException(status_code=404, detail="Tutor not found")

        # Check if the time slot is available
        cursor.execute(
            """
            SELECT is_available FROM tutor_availability 
            WHERE tutor_id = %s AND day_of_week = %s AND time_slot = %s
            """,
            (tutor["id"], request.day_of_week, request.time_slot)
        )
        availability = cursor.fetchone()
        
        if not availability or not availability['is_available']:
            raise HTTPException(status_code=400, detail="Time slot not available")


        # Update availability for the full duration
        cursor.execute(
            """
            UPDATE tutor_availability 
            SET is_available = FALSE 
            WHERE tutor_id = %s AND day_of_week = %s AND time_slot >= %s AND time_slot < %s
            """,
            (
                tutor["id"],
                request.day_of_week,
                request.time_slot,
                request.time_slot + request.duration
            )
        )

        scheduled_at = get_next_scheduled_datetime(request.day_of_week, request.time_slot)
        cursor.execute(
            """
            INSERT INTO bookings 
            (tutor_id, student_id, day_of_week, duration, frequency, scheduled_at)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (tutor["id"], request.student_id, request.day_of_week, request.duration, request.frequency, scheduled_at)
        )

        

        conn.commit()
        return {"message": "Booked successfully!"}

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.get("/students/next-lesson")
async def get_next_lesson(current_user: UserInDB = Depends(get_current_active_user)):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        if current_user.user_type == 'tutor':
            # For tutors, search by tutor_id and get student info
            cursor.execute("""
                SELECT 
                    b.day_of_week,
                    b.duration,
                    b.frequency,
                    b.scheduled_at,
                    u.first_name AS student_first_name,
                    u.last_name AS student_last_name,
                    u.profile_picture_url AS student_profile_picture,
                    u.public_id AS student_public_id
                FROM 
                    bookings b
                JOIN 
                    users u ON b.student_id = u.id
                WHERE 
                    b.tutor_id = %s
                    AND NOW() < DATE_ADD(b.scheduled_at, INTERVAL b.duration * 30 MINUTE)
                ORDER BY 
                    b.scheduled_at ASC
                LIMIT 1;
            """, (current_user.id,))
        else:
            # For students, search by student_id and get tutor info
            cursor.execute("""
                SELECT 
                    b.day_of_week,
                    b.duration,
                    b.frequency,
                    b.scheduled_at,
                    u.first_name AS tutor_first_name,
                    u.last_name AS tutor_last_name,
                    u.profile_picture_url AS tutor_profile_picture,
                    u.subject AS tutor_subject,
                    u.public_id AS tutor_public_id,
                    u.hourly_rate AS tutor_hourly_rate
                FROM 
                    bookings b
                JOIN 
                    users u ON b.tutor_id = u.id
                WHERE 
                    b.student_id = %s
                    AND NOW() < DATE_ADD(b.scheduled_at, INTERVAL b.duration * 30 MINUTE)
                ORDER BY 
                    b.scheduled_at ASC
                LIMIT 1;
            """, (current_user.id,))

        lesson = cursor.fetchone()
        if not lesson:
            return {"message": "No upcoming lessons found"}
        
        if current_user.user_type == 'tutor':
            return {
                "student_first_name": lesson["student_first_name"],
                "student_last_name": lesson["student_last_name"],
                "student_profile_picture": lesson["student_profile_picture"],
                "student_public_id": lesson["student_public_id"],
                "day_of_week": lesson["day_of_week"],
                "duration": lesson["duration"]*30, # Convert to minutes
                "frequency": lesson["frequency"],
                "scheduled_at": lesson["scheduled_at"],
                "time_left": (lesson["scheduled_at"] - datetime.now()).total_seconds()
            }
        else:
            return {
                "tutor_first_name": lesson["tutor_first_name"],
                "tutor_last_name": lesson["tutor_last_name"],
                "tutor_profile_picture": lesson["tutor_profile_picture"],
                "tutor_subject": lesson["tutor_subject"],
                "tutor_public_id": lesson["tutor_public_id"],
                "tutor_hourly_rate": lesson["tutor_hourly_rate"],
                "day_of_week": lesson["day_of_week"],
                "duration": lesson["duration"]*30, # Convert to minutes
                "frequency": lesson["frequency"],
                "scheduled_at": lesson["scheduled_at"],
                "time_left": (lesson["scheduled_at"] - datetime.now()).total_seconds()
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()
@app.get("/get-lesson-link")
async def get_lesson_link(current_user: UserInDB = Depends(get_current_active_user)):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT id AS booking_id, scheduled_at
            FROM bookings
            WHERE tutor_id = %s
              AND NOW() > DATE_SUB(scheduled_at, INTERVAL 5 MINUTE)
              AND NOW() < DATE_ADD(scheduled_at, INTERVAL duration * 30 MINUTE)
            ORDER BY scheduled_at ASC
            LIMIT 1;
        """, (current_user.id,))
        lesson = cursor.fetchone()

        if not lesson:
            raise HTTPException(status_code=404, detail="No upcoming lessons found")

        booking_id = lesson["booking_id"]

        # Create unique room name (deterministic per booking, or use secrets.token_hex for randomness)
        room_name = f"booking_{booking_id}"

        now = datetime.utcnow()
        expire = now + timedelta(hours=10)  # Example: Token expires in 1 hour

        # Generate JWT token
        payload = {
            "typ": "JWT",
            "alg": "HS256",
            "aud": JWT_APP_ID,
            "iss": JWT_APP_ID,
            "sub": str(current_user.public_id),  # Ensure sub is a string
            "room": room_name,  # Use the generated room_name
            "iat": int(now.timestamp()),
            "nbf": int(now.timestamp()),
            "exp": int(expire.timestamp()),
            "context": {
                "user": {
                    "name": current_user.first_name or "Participant",
                    "id": str(current_user.public_id)  # Ensure id is a string
                }
            }
        }

        token = jwt.encode(payload, JWT_APP_SECRET, algorithm="HS256")

        lesson_url = f"https://{JITSI_DOMAIN}:8443/{room_name}?jwt={token}"

        # Insert or update jitsi room info
        cursor.execute("""
            INSERT INTO jitsi_rooms (booking_id, room_name, jwt_token, created_at)
            VALUES (%s, %s, %s, NOW())
            ON DUPLICATE KEY UPDATE jwt_token = VALUES(jwt_token);
        """, (booking_id, room_name, token))
        conn.commit()

        return {"lesson_link": lesson_url}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()