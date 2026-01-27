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
# Note: we fetch inside the send function to ensure environment is read at runtime
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
SENDER_EMAIL = os.getenv("SENDER_EMAIL")

def generate_otp() -> str:
    """Generate 6-digit OTP"""
    return str(random.randint(100000, 999999))

def send_otp_email(recipient_email: str, otp: str) -> bool:
    """Send OTP via SendGrid API (bypasses firewall constraints)"""

    # Read env at call time to avoid stale values
    sendgrid_api_key = os.getenv("SENDGRID_API_KEY", "").strip()
    sender_email = os.getenv("SENDER_EMAIL", "").strip()

    api_key_present = bool(sendgrid_api_key)
    sender_present = bool(sender_email)

    # Minimal, non-sensitive diagnostics
    if api_key_present:
        print("ℹ️  SendGrid API key detected (masked)")
    else:
        print("⚠️  SendGrid API key missing at runtime")

    if sender_present:
        print(f"ℹ️  Sender email configured: {sender_email}")
    else:
        print("⚠️  Sender email missing at runtime")
    
    # 1. Check configuration
    if not api_key_present or not sender_present:
        print(f"⚠️  SendGrid NOT CONFIGURED - Check Railway Variables (SENDGRID_API_KEY, SENDER_EMAIL)")
        print(f"⚠️  Cannot send OTP to {recipient_email} - Email not configured")
        return False
    
    if not SENDGRID_AVAILABLE:
        print(f"❌ sendgrid library not installed - install with: pip install sendgrid")
        print(f"❌ Unable to send OTP to {recipient_email}")
        print("="*60 + "\n")
        return False
    
    try:
        print(f"📤 Attempting to send OTP to {recipient_email}...")

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
        print(f"🔗 Connecting to SendGrid API...")
        sg = SendGridAPIClient(sendgrid_api_key)
        response = sg.send(message)
        
        print(f"📨 SendGrid API response status: {response.status_code}")
        
        if response.status_code in [200, 201, 202]:
            print(f"✅ SUCCESS: OTP email sent to {recipient_email}")
            print("="*60 + "\n")
            return True
        else:
            body_preview = getattr(response, "body", b"") or b""
            decoded = body_preview.decode(errors="ignore") if isinstance(body_preview, (bytes, bytearray)) else str(body_preview)
            print(f"❌ SendGrid API error status: {response.status_code}")
            print(f"❌ Unable to send OTP to {recipient_email}")
            if decoded:
                print(f"📋 Response body: {decoded[:300]}")
            print("="*60 + "\n")
            return False
    
    except Exception as e:
        import traceback
        print(f"❌ EXCEPTION during SendGrid send: {type(e).__name__}")
        print(f"❌ Unable to send OTP to {recipient_email}")
        print(f"📋 Error message: {str(e)[:300]}")
        print(f"📋 Full traceback:\n{traceback.format_exc()}")
        print("="*60 + "\n")
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
