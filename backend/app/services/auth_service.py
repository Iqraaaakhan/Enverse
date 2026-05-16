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

def generate_otp() -> str:
    """Generate 6-digit OTP"""
    return str(random.randint(100000, 999999))

def _otp_email_html(otp: str) -> str:
    return f"""
    <html>
    <body style='font-family: Arial, sans-serif; padding: 20px;'>
        <h2>Your Enverse Login Code</h2>
        <div style='background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center;'>
            <span style='font-size: 32px; font-weight: bold; letter-spacing: 8px;'>{otp}</span>
        </div>
        <p>This code expires in 10 minutes.</p>
    </body>
    </html>
    """

def _send_via_sendgrid(recipient_email: str, otp: str, api_key: str, sender_email: str) -> bool:
    if not SENDGRID_AVAILABLE:
        print("❌ SendGrid package is not available. Check requirements.txt.")
        return False

    if not api_key:
        print("❌ SendGrid not configured: missing SENDGRID_API_KEY")
        return False

    if not sender_email:
        print("❌ SendGrid not configured: missing SENDER_EMAIL")
        return False

    try:
        print(f"📤 Attempting to send OTP to {recipient_email} via SendGrid API...")
        message = Mail(
            from_email=sender_email,
            to_emails=recipient_email,
            subject="Your Enverse Login Code",
            html_content=_otp_email_html(otp),
        )
        response = SendGridAPIClient(api_key).send(message)
        print(f"📨 SendGrid API response status: {response.status_code}")
        if response.status_code in [200, 201, 202]:
            print(f"✅ SUCCESS: OTP email accepted by SendGrid for {recipient_email}")
            return True

        print(f"❌ SendGrid API rejected OTP email with status {response.status_code}")
        if getattr(response, "body", None):
            print(f"📋 SendGrid response body: {response.body}")
        return False
    except Exception as e:
        import traceback
        print(f"❌ EXCEPTION during SendGrid send: {type(e).__name__}")
        print(f"❌ Unable to send OTP to {recipient_email} via SendGrid")
        print(f"📋 Error message: {str(e)[:300]}")
        print(f"📋 Full traceback:\n{traceback.format_exc()}")
        return False

def _smtp_fallback_enabled() -> bool:
    return os.getenv("SMTP_FALLBACK_ENABLED", "false").strip().lower() in {
        "1",
        "true",
        "yes",
        "on",
    }

def _send_via_smtp(recipient_email: str, otp: str) -> bool:
    smtp_user = os.getenv("SMTP_USER", os.getenv("SENDER_EMAIL", "")).strip()
    smtp_pass = os.getenv("SMTP_PASS", os.getenv("SENDER_PASSWORD", "")).strip()
    smtp_sender = os.getenv("SMTP_SENDER", smtp_user).strip()
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com").strip()
    smtp_port = int(os.getenv("SMTP_PORT", "587"))

    if not smtp_user or not smtp_pass:
        print("❌ SMTP fallback not configured: missing SMTP_USER/SMTP_PASS or SENDER_EMAIL/SENDER_PASSWORD")
        return False

    try:
        print(f"📤 SMTP fallback activated for {recipient_email} via {smtp_server}:{smtp_port}")
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        msg = MIMEMultipart()
        msg["From"] = smtp_sender
        msg["To"] = recipient_email
        msg["Subject"] = "Your Enverse Login Code"
        msg.attach(MIMEText(_otp_email_html(otp), "html"))
        with smtplib.SMTP(smtp_server, smtp_port, timeout=10) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_sender, recipient_email, msg.as_string())
        print(f"✅ SUCCESS: OTP email sent to {recipient_email} via SMTP fallback")
        return True
    except Exception as e:
        import traceback
        print(f"❌ EXCEPTION during SMTP fallback send: {type(e).__name__}")
        print(f"❌ Unable to send OTP to {recipient_email} via SMTP fallback")
        print(f"📋 Error message: {str(e)[:300]}")
        print(f"📋 Full traceback:\n{traceback.format_exc()}")
        return False

def send_otp_email(recipient_email: str, otp: str) -> bool:
    """Send OTP via SendGrid API first, with SMTP only as an opt-in fallback."""
    sendgrid_api_key = os.getenv("SENDGRID_API_KEY", "").strip()
    sender_email = os.getenv("SENDER_EMAIL", "").strip()

    if _send_via_sendgrid(recipient_email, otp, sendgrid_api_key, sender_email):
        print("="*60 + "\n")
        return True

    print("⚠️ SendGrid delivery failed or is not configured.")
    if not _smtp_fallback_enabled():
        print("ℹ️ SMTP fallback disabled. Set SMTP_FALLBACK_ENABLED=true to enable it.")
        print("="*60 + "\n")
        return False

    print("⚠️ Falling back to SMTP transport.")
    result = _send_via_smtp(recipient_email, otp)
    print("="*60 + "\n")
    return result

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
