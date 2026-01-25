import os
import random
import smtplib
import socket
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
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SENDER_EMAIL = os.getenv("SENDER_EMAIL")
SENDER_PASSWORD = os.getenv("SENDER_PASSWORD")

def generate_otp() -> str:
    """Generate 6-digit OTP"""
    return str(random.randint(100000, 999999))

def send_otp_email(recipient_email: str, otp: str) -> bool:
    """Send OTP via email using SMTP"""
    # For development: Print OTP to console if email not configured
    if not SENDER_EMAIL or not SENDER_PASSWORD:
        print(f"⚠️  SMTP NOT CONFIGURED - Check SENDER_EMAIL and SENDER_PASSWORD env vars")
        print(f"📧 DEV MODE - OTP for {recipient_email}: {otp}")
        return True  # Allow login in dev mode
    
    try:
        print(f"📤 Attempting to send OTP to {recipient_email}")
        print(f"   Using SMTP: {SMTP_SERVER}:{SMTP_PORT}")
        print(f"   From: {SENDER_EMAIL}")
        
        # Set socket timeout to prevent hanging
        socket.setdefaulttimeout(10)
        
        # Create message
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = recipient_email
        msg['Subject'] = "Your Enverse Login OTP"
        
        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px;">
                <h2 style="color: #1e293b;">Your Enverse Login Code</h2>
                <p style="color: #64748b; font-size: 16px;">Enter this code to access your dashboard:</p>
                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
                    <span style="font-size: 32px; font-weight: bold; color: #0f172a; letter-spacing: 8px;">{otp}</span>
                </div>
                <p style="color: #94a3b8; font-size: 14px;">This code expires in 10 minutes.</p>
                <p style="color: #94a3b8; font-size: 14px;">If you didn't request this, please ignore this email.</p>
            </div>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(body, 'html'))
        
        # Send email using SMTP_SSL on port 465 (better cloud compatibility)
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=10) as server:
            print("   🔌 Connecting to SMTP server (smtp.gmail.com:465)...")
            print("   🔐 Authenticating...")
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            print("   📨 Sending message...")
            server.send_message(msg)
        
        print(f"✅ OTP successfully sent to {recipient_email}")
        return True
    
    except smtplib.SMTPAuthenticationError as e:
        print(f"❌ SMTP Authentication Failed: {e}")
        print(f"   Check your SENDER_EMAIL and SENDER_PASSWORD")
        print(f"   For Gmail, use app-specific password: https://myaccount.google.com/apppasswords")
        return False
    except smtplib.SMTPException as e:
        print(f"❌ SMTP Error: {e}")
        return False
    except Exception as e:
        print(f"❌ Email sending failed: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
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
