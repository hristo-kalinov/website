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
        cursor = conn.cursor()

        query = """
        UPDATE bookings
        SET active = FALSE
        WHERE active = TRUE
          AND NOW() >= DATE_ADD(scheduled_at, INTERVAL duration MINUTE)
        """
        cursor.execute(query)
        conn.commit()

        print(f"[{datetime.now()}] Updated expired bookings.")

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
    #while True:
        #sleep_until_next_half_hour()
    update_expired_bookings()

if __name__ == "__main__":
    main()
