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
import json
from fastapi import WebSocket, WebSocketDisconnect
from fastapi import Query
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
    last_message: Optional[Message] = None

    class Config:
        from_attributes = True

JWT_APP_ID = "your_app_id"
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

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await manager.connect(websocket, user_id)
    try:
        while True:
            await websocket.receive_text()  # keep alive
    except WebSocketDisconnect:
        await manager.disconnect(websocket, user_id)

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
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        if user:
            return UserInDB(**user)
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
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        if user_data['user_type'] == 'tutor':
            cursor.execute("""
                INSERT INTO users 
                (email, password_hash, first_name, last_name, user_type,
                 subject, profile_title, hourly_rate, bio, profile_picture_url, 
                 verification_status, rating, total_reviews, balance, is_active)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                user_data['email'],
                hashed_password,
                user_data['first_name'],
                user_data['last_name'],
                'tutor',
                user_data['subject'],
                user_data['title'],
                float(user_data['price']),
                user_data['description'],
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
                (email, password_hash, first_name, last_name, user_type) 
                VALUES (%s, %s, %s, %s, %s)
            """, (
                user_data['email'], 
                hashed_password, 
                user_data['first_name'], 
                user_data['last_name'],
                'student'
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
    room = secrets.token_hex(16)
    now = datetime.utcnow() + timedelta(hours=3)
    expire = now + timedelta(minutes=JWT_EXPIRE_MINUTES)
    
    payload = {
        "typ": "JWT",
        "alg": "HS256",
        "aud": JWT_APP_ID,
        "iss": JWT_APP_ID,
        "sub": "*",
        "room": "*",
        "iat": int(now.timestamp()),
        "nbf": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=JWT_EXPIRE_MINUTES)).timestamp()),
        "context": {
            "user": {
            "name": f"{current_user.first_name}"
            }
        }
    }

    token = jwt.encode(payload, JWT_APP_SECRET, algorithm=JWT_ALGORITHM)
    return {"jitsi_token": token, "room": room}

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
                id,
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

@app.get("/tutors/{tutor_id}", response_model=Tutor)
async def get_tutor_details(
    tutor_id: int,
    current_user: UserInDB = Depends(get_current_active_user)
):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("""
            SELECT 
                id,
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
            WHERE id = %s AND is_active = TRUE AND user_type = 'tutor'
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

@app.post("/conversations/start/{tutor_id}", response_model=Conversation)
async def start_conversation(
    tutor_id: int,
    current_user: UserInDB = Depends(get_current_active_user)
):
    if current_user.user_type != "student":
        raise HTTPException(status_code=403, detail="Only students can start conversations")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Check if tutor exists and is actually a tutor
        cursor.execute("""
            SELECT id FROM users 
            WHERE id = %s AND is_active = TRUE AND user_type = 'tutor'
        """, (tutor_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Tutor not found")
        
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
                       u.first_name as student_first_name,
                       u.last_name as student_last_name,
                       u.profile_picture_url as student_image
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
                       u.first_name as tutor_first_name,
                       u.last_name as tutor_last_name,
                       u.profile_picture_url as tutor_image,
                       u.subject as tutor_subject
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