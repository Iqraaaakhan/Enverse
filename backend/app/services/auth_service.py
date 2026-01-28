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
    """Send OTP via SendGrid if configured, else fallback to SMTP if available."""

    # Read env at call time to avoid stale values
    sendgrid_api_key = os.getenv("SENDGRID_API_KEY", "").strip()
    sender_email = os.getenv("SENDER_EMAIL", "").strip()

    # SMTP fallback variables
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = os.getenv("SMTP_PORT", "587")
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_pass = os.getenv("SMTP_PASS", "")
    smtp_sender = os.getenv("SMTP_SENDER", smtp_user)

    # 1️⃣ Try SendGrid if configured
    if sendgrid_api_key and sender_email and SENDGRID_AVAILABLE:
        try:
            print(f"📤 Attempting to send OTP to {recipient_email} via SendGrid...")
            from sendgrid.helpers.mail import Mail
            message = Mail(
                from_email=sender_email,
                to_emails=recipient_email,
                subject="Your Enverse Login Code",
                html_content=f"""
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
            )
            sg = SendGridAPIClient(sendgrid_api_key)
            response = sg.send(message)
            print(f"📨 SendGrid API response status: {response.status_code}")
            if response.status_code in [200, 201, 202]:
                print(f"✅ SUCCESS: OTP email sent to {recipient_email}")
                print("="*60 + "\n")
                return True
            else:
                print(f"❌ SendGrid API error status: {response.status_code}")
                return False
        except Exception as e:
            import traceback
            print(f"❌ EXCEPTION during SendGrid send: {type(e).__name__}")
            print(f"❌ Unable to send OTP to {recipient_email}")
            print(f"📋 Error message: {str(e)[:300]}")
            print(f"📋 Full traceback:\n{traceback.format_exc()}")
            print("="*60 + "\n")
            # Fallback to SMTP if SendGrid fails

    # 2️⃣ Fallback to SMTP if all vars present
    if all([smtp_host, smtp_port, smtp_user, smtp_pass, smtp_sender]):
        try:
            print(f"📤 Attempting to send OTP to {recipient_email} via SMTP...")
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            msg = MIMEMultipart()
            msg['From'] = smtp_sender
            msg['To'] = recipient_email
            msg['Subject'] = "Your Enverse Login Code"
            html = f"""
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
            msg.attach(MIMEText(html, 'html'))
            with smtplib.SMTP(smtp_host, int(smtp_port)) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(smtp_sender, recipient_email, msg.as_string())
            print(f"✅ SUCCESS: OTP email sent to {recipient_email} via SMTP")
            print("="*60 + "\n")
            return True
        except Exception as e:
            import traceback
            print(f"❌ EXCEPTION during SMTP send: {type(e).__name__}")
            print(f"❌ Unable to send OTP to {recipient_email}")
            print(f"📋 Error message: {str(e)[:300]}")
            print(f"📋 Full traceback:\n{traceback.format_exc()}")
            print("="*60 + "\n")
            return False

    print(f"❌ No email provider configured. Check your .env for SendGrid or SMTP settings.")
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
