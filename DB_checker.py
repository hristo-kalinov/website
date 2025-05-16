import time
import mysql.connector
from datetime import datetime, timedelta

DB_CONFIG = {
    'host': 'localhost',
    'database': 'website_db',
    'user': 'root',
    'password': 'amsterdam',
    'use_pure': True
}

def update_expired_bookings():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)

        # Fetch all expired active bookings
        cursor.execute("""
            SELECT id, tutor_id, day_of_week, scheduled_at, duration, frequency
            FROM bookings
            WHERE active = TRUE
              AND NOW() >= DATE_ADD(scheduled_at, INTERVAL duration MINUTE)
        """)
        expired_bookings = cursor.fetchall()

        for booking in expired_bookings:
            lesson_id = booking["id"]
            tutor_id = booking["tutor_id"]
            day_of_week = booking["day_of_week"]
            scheduled_at = booking["scheduled_at"]
            duration = booking["duration"]
            frequency = booking["frequency"]

            # Mark as inactive and completed
            cursor.execute("""
                UPDATE bookings 
                SET active = FALSE, status = 'completed' 
                WHERE id = %s
            """, (lesson_id,))

            # Calculate the time slots
            start_slot = scheduled_at.hour * 2 + (1 if scheduled_at.minute >= 30 else 0)
            end_time = scheduled_at + timedelta(minutes=duration)
            end_slot = end_time.hour * 2 + (1 if end_time.minute > 0 else 0)

            if frequency == "once":
                # Free up time slots
                for time_slot in range(start_slot, end_slot):
                    cursor.execute("""
                        UPDATE tutor_availability 
                        SET is_available = TRUE 
                        WHERE tutor_id = %s AND day_of_week = %s AND time_slot = %s
                    """, (tutor_id, day_of_week, time_slot))
            elif frequency == "weekly":
                # Schedule a new lesson for next week
                new_datetime = scheduled_at + timedelta(weeks=1)
                cursor.execute("""
                    INSERT INTO bookings (
                        tutor_id, student_id, day_of_week, scheduled_at, duration, frequency
                    )
                    SELECT tutor_id, student_id, day_of_week, %s, duration, frequency
                    FROM bookings
                    WHERE id = %s
                """, (new_datetime, lesson_id))

        conn.commit()
        print(f"[{datetime.now()}] Updated {len(expired_bookings)} expired bookings.")

    except mysql.connector.Error as err:
        print(f"Error: {err}")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def sleep_until_next_half_hour():
    now = datetime.now()
    next_minute = 30 if now.minute < 30 else 60
    next_time = now.replace(second=0, microsecond=0, minute=next_minute if next_minute != 60 else 0)
    if next_minute == 60:
        next_time += timedelta(hours=1)
    sleep_seconds = (next_time - now).total_seconds()
    print(f"Sleeping for {int(sleep_seconds)} seconds until next check at {next_time.time()}")
    time.sleep(sleep_seconds)

def main():
    while True:
        sleep_until_next_half_hour()
        update_expired_bookings()

if __name__ == "__main__":
    main()
