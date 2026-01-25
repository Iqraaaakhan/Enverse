import os
import random
from datetime import datetime, timedelta
from pathlib import Path
import jwt
from dotenv import load_dotenv

try:
    from sendgrid import SendGridAPIClient
    from sendgrid.helpers.mail import Mail
    SENDGRID_AVAILABLE = True
except ImportError:
    SENDGRID_AVAILABLE = False

# Load .env from backend directory
backend_dir = Path(__file__).resolve().parent.parent.parent
env_path = backend_dir / '.env'
load_dotenv(dotenv_path=env_path)

# JWT Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "enverse_secret_key_change_in_production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Email Configuration (SendGrid)
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
SENDER_EMAIL = os.getenv("SENDER_EMAIL")

def generate_otp() -> str:
    """Generate 6-digit OTP"""
    return str(random.randint(100000, 999999))

def send_otp_email(recipient_email: str, otp: str) -> bool:
    """Send OTP via SendGrid API (bypasses firewall constraints)"""
    
    # 1. Check configuration
    if not SENDGRID_API_KEY or not SENDER_EMAIL:
        print(f"⚠️  SendGrid NOT CONFIGURED - Check Railway Variables (SENDGRID_API_KEY, SENDER_EMAIL)")
        print(f"⚠️  Cannot send OTP to {recipient_email} - Email not configured")
        return False
    
    if not SENDGRID_AVAILABLE:
        print(f"⚠️  sendgrid library not installed")
        print(f"⚠️  Cannot send OTP to {recipient_email} - Package missing")
        return False
    
    try:
        # 2. Create email message
        message = Mail(
            from_email=SENDER_EMAIL,
            to_emails=recipient_email,
            subject="Your Enverse Login Code",
            html_content=f"""
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
        )
        
        # 3. Send via SendGrid API
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        
        if response.status_code in [200, 201, 202]:
            print(f"✅ OTP successfully sent to {recipient_email} via SendGrid")
            return True
        else:
            print(f"❌ SendGrid API error: {response.status_code} - Unable to send OTP to {recipient_email}")
            return False
    
    except Exception as e:
        print(f"❌ SendGrid email failed: {e}")
        print(f"📧 FALLBACK DEBUG OTP for type(e).__name__} - Unable to send OTP to {recipient_email}")
        print(f"⚠️  Error details: {str(e)[:100]}")  # Log first 100 chars only

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
