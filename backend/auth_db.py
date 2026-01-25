import sqlite3
import os
from pathlib import Path
from datetime import datetime

# Database path - Railway-aware
# If running on Railway (volume mounted at /app/storage), use that path
# Otherwise use local development path
if os.getenv("RAILWAY_ENVIRONMENT"):
    DB_PATH = Path("/app/storage/auth.db")
    # Ensure storage directory exists
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
else:
    DB_PATH = Path(__file__).parent / "auth.db"

def init_db():
    """Initialize SQLite database with users and OTP tables"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    
    # OTP table (for temporary OTP storage)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS otps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            otp TEXT NOT NULL,
            created_at TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            used INTEGER DEFAULT 0
        )
    """)
    
    conn.commit()
    conn.close()
    print("✅ Auth Database Initialized")

def get_or_create_user(email: str):
    """Get existing user or create new one"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if user exists
    cursor.execute("SELECT id, email FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    
    if user:
        conn.close()
        return {"id": user[0], "email": user[1]}
    
    # Create new user
    cursor.execute(
        "INSERT INTO users (email, created_at) VALUES (?, ?)",
        (email, datetime.utcnow().isoformat())
    )
    user_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return {"id": user_id, "email": email}

def store_otp(email: str, otp: str, expires_in_minutes: int = 10):
    """Store OTP with expiration"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    from datetime import timedelta
    created_at = datetime.utcnow()
    expires_at = created_at + timedelta(minutes=expires_in_minutes)
    
    cursor.execute(
        "INSERT INTO otps (email, otp, created_at, expires_at) VALUES (?, ?, ?, ?)",
        (email, otp, created_at.isoformat(), expires_at.isoformat())
    )
    
    conn.commit()
    conn.close()

def verify_otp(email: str, otp: str) -> bool:
    """Verify OTP is valid and not expired"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute(
        """
        SELECT id, expires_at, used FROM otps 
        WHERE email = ? AND otp = ? 
        ORDER BY created_at DESC LIMIT 1
        """,
        (email, otp)
    )
    
    result = cursor.fetchone()
    
    if not result:
        conn.close()
        return False
    
    otp_id, expires_at, used = result
    
    # Check if already used
    if used:
        conn.close()
        return False
    
    # Check expiration
    if datetime.fromisoformat(expires_at) < datetime.utcnow():
        conn.close()
        return False
    
    # Mark as used
    cursor.execute("UPDATE otps SET used = 1 WHERE id = ?", (otp_id,))
    conn.commit()
    conn.close()
    
    return True

def get_last_otp(email: str):
    """Retrieve the most recent OTP for the given email that is not used and not expired.
    Returns the OTP string or None if not found.
    """
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT otp, expires_at, used FROM otps
        WHERE email = ?
        ORDER BY created_at DESC LIMIT 1
        """,
        (email,)
    )

    row = cursor.fetchone()
    if not row:
        conn.close()
        return None

    otp, expires_at, used = row

    # Validate not used and not expired
    if used:
        conn.close()
        return None
    if datetime.fromisoformat(expires_at) < datetime.utcnow():
        conn.close()
        return None

    conn.close()
    return otp

if __name__ == "__main__":
    init_db()
