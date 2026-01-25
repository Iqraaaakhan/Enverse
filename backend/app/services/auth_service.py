import os
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from pathlib import Path
import jwt
from dotenv import load_dotenv

# Load .env from backend directory
backend_dir = Path(__file__).resolve().parent.parent.parent
env_path = backend_dir / '.env'
load_dotenv(dotenv_path=env_path)

# JWT Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "enverse_secret_key_change_in_production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Email Configuration
# Note: Using hardcoded smtp.gmail.com:465 (SMTP_SSL) for better cloud compatibility
SENDER_EMAIL = os.getenv("SENDER_EMAIL")
SENDER_PASSWORD = os.getenv("SENDER_PASSWORD")

def generate_otp() -> str:
    """Generate 6-digit OTP"""
    return str(random.randint(100000, 999999))

def send_otp_email(recipient_email: str, otp: str) -> bool:
    """Send OTP via email using SMTP_SSL on Port 465"""
    
    # 1. Dev Mode / Safety Check
    if not SENDER_EMAIL or not SENDER_PASSWORD:
        print(f"⚠️  SMTP NOT CONFIGURED - Check Railway Variables")
        print(f"📧 DEBUG OTP for {recipient_email}: {otp}")
        return True  # Returns True so you can still log in using the logs
    
    try:
        # 2. Create the Email Message
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = recipient_email
        msg['Subject'] = "Your Enverse Login OTP"
        
        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Your Enverse Login Code</h2>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px;">{otp}</span>
            </div>
            <p>This code expires in 10 minutes.</p>
        </body>
        </html>
        """
        msg.attach(MIMEText(body, 'html'))
        
        # 3. Connect and Send (Using SSL Port 465 - Best for Railway)
        print(f"🔌 Connecting to smtp.gmail.com:465...")
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=10) as server:
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.send_message(msg)
        
        print(f"✅ OTP successfully sent to {recipient_email}")
        return True
    
    except Exception as e:
        print(f"❌ Email sending failed: {e}")
        # We print the OTP here too so you aren't locked out if the email fails
        print(f"📧 FALLBACK DEBUG OTP: {otp}")
        return False

def create_jwt_token(email: str) -> str:
    """Create JWT token for authenticated user"""
    payload = {
        "email": email,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.utcnow()
    }
    
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_jwt_token(token: str) -> dict:
    """Verify JWT token and return payload"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
