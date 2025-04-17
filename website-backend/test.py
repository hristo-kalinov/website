import mysql.connector
from mysql.connector import Error

def test_connection():
    try:
        print("Attempting to connect...")
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="amsterdam",  # Replace with your password
            port=3306,
            connection_timeout=5,  # Force timeout after 5 seconds
            use_pure=True
        )
        print("✅ Connection successful!")
        conn.close()
    except Error as e:
        print(f"❌ Connection failed: {e}")

test_connection()