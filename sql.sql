-- Create the database
CREATE DATABASE IF NOT EXISTS website_db;

-- Select the database for use
USE website_db;

-- USERS table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    public_id VARCHAR(36) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    user_type ENUM('tutor', 'student') NOT NULL,
    profile_picture_url TEXT,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    subject VARCHAR(255),
    profile_title VARCHAR(255),
    bio TEXT,
    hourly_rate DECIMAL(10, 2),
    video_intro_url TEXT,
    verification_status ENUM('unverified', 'verified', 'rejected') DEFAULT 'unverified',
    rating DECIMAL(3, 2),
    total_reviews INT DEFAULT 0
);

-- CONVERSATIONS table
CREATE TABLE conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tutor_id INT NOT NULL,
    student_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tutor_id) REFERENCES users(id),
    FOREIGN KEY (student_id) REFERENCES users(id)
);

-- MESSAGES table
CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    sender_id INT NOT NULL,
    content TEXT NOT NULL,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id)
);

CREATE TABLE tutor_availability (
    id SERIAL PRIMARY KEY,
    tutor_id INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    time_slot INTEGER NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT unique_tutor_time_slot UNIQUE (tutor_id, day_of_week, time_slot)
);
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  tutor_id INTEGER REFERENCES users(id),
  student_id INTEGER REFERENCES users(id),
  day_of_week INTEGER,
  duration INTEGER,
  frequency VARCHAR(10),
  scheduled_at DATETIME
);

SELECT 
    b.day_of_week,
    b.time_slot,
    b.duration,
    b.frequency,
    b.scheduled_at,
    u.first_name AS tutor_first_name,
    u.last_name AS tutor_last_name
FROM 
    bookings b
JOIN 
    users u ON b.tutor_id = u.id
WHERE 
    b.student_id = 2
    AND b.scheduled_at > NOW()
ORDER BY 
    b.scheduled_at ASC
LIMIT 1; 

SELECT * FROM bookings;
DROP TABLE bookings;
SELECT * FROM users;