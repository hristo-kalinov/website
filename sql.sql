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
    total_reviews INT DEFAULT 0,
    email_verification_token VARCHAR(255) UNIQUE,
    token_created_at DATETIME,  -- Added for tracking token generation time
    email_verified_at DATETIME,
    INDEX idx_email_verification_token (email_verification_token),  -- Added for faster lookups
    INDEX idx_email_verified (email_verified_at)  -- Added for verification queries
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
    id INT AUTO_INCREMENT PRIMARY KEY,
    tutor_id INT,
    student_id INT,
    day_of_week INT,
    duration INT,
    frequency VARCHAR(10),
    scheduled_at DATETIME,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    FOREIGN KEY (tutor_id) REFERENCES users(id),
    FOREIGN KEY (student_id) REFERENCES users(id)
);
CREATE TABLE jitsi_rooms (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL UNIQUE,
  room_name VARCHAR(255) NOT NULL,
  jwt_token TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

SELECT * FROM users;