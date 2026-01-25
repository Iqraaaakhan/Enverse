# 📧 Email Setup for Railway Deployment

## ⚠️ Required Environment Variables

Your OTP login system requires SMTP credentials. Add these to Railway:

### Railway Dashboard Steps:

1. **Go to your project**: https://railway.app/dashboard
2. **Click on your backend service**
3. **Go to "Variables" tab**
4. **Add the following**:

```bash
SENDER_EMAIL=your-email@gmail.com
SENDER_PASSWORD=xxxx-xxxx-xxxx-xxxx
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
JWT_SECRET=generate-random-string-here
```

---

## 🔐 Gmail App Password Setup

### Step 1: Enable 2-Factor Authentication
1. Go to https://myaccount.google.com/security
2. Find "2-Step Verification"
3. Click "Get Started" and follow prompts

### Step 2: Generate App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select app: "Mail"
3. Select device: "Other (custom name)" → Enter "Enverse"
4. Click "Generate"
5. Copy the 16-character password (format: `xxxx xxxx xxxx xxxx`)
6. Use this as `SENDER_PASSWORD` on Railway (remove spaces)

### Step 3: Verify in Railway Logs
After adding variables, Railway will auto-redeploy. Check logs for:
```
✅ OTP sent to user@example.com
```

Instead of:
```
📧 DEV MODE - OTP for user@example.com: 123456
```

---

## 🧪 Test Locally First

Create `backend/.env`:
```bash
GOOGLE_API_KEY=your_gemini_key
SENDER_EMAIL=your-email@gmail.com
SENDER_PASSWORD=your-app-password
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
JWT_SECRET=test_secret_key
```

Run backend:
```bash
cd backend
python -m uvicorn app.main:app --reload
```

Test email:
```bash
curl -X POST http://127.0.0.1:8000/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"your-test-email@gmail.com"}'
```

Check your inbox for OTP email.

---

## 🚨 Alternative: Use Different Email Provider

### SendGrid:
```bash
SMTP_SERVER=smtp.sendgrid.net
SMTP_PORT=587
SENDER_EMAIL=apikey
SENDER_PASSWORD=your_sendgrid_api_key
```

### Mailgun:
```bash
SMTP_SERVER=smtp.mailgun.org
SMTP_PORT=587
SENDER_EMAIL=postmaster@your-domain.mailgun.org
SENDER_PASSWORD=your_mailgun_password
```

### Outlook/Hotmail:
```bash
SMTP_SERVER=smtp-mail.outlook.com
SMTP_PORT=587
SENDER_EMAIL=your-email@outlook.com
SENDER_PASSWORD=your_password
```

---

## ✅ Verification Checklist

- [ ] 2FA enabled on Gmail
- [ ] App-specific password generated
- [ ] `SENDER_EMAIL` added to Railway
- [ ] `SENDER_PASSWORD` added to Railway (without spaces)
- [ ] `SMTP_SERVER` and `SMTP_PORT` added
- [ ] `JWT_SECRET` added (any random string)
- [ ] Railway redeployed successfully
- [ ] Logs show `✅ OTP sent` instead of `📧 DEV MODE`
- [ ] Test email received in inbox

---

## 🔍 Current Issue

Your deployment is **missing SMTP credentials**, so emails aren't being sent.

**Code reference:** [auth_service.py](backend/app/services/auth_service.py#L35-L38)
```python
if not SENDER_EMAIL or not SENDER_PASSWORD:
    print(f"📧 DEV MODE - OTP for {recipient_email}: {otp}")
    return True  # Silently succeeds without sending real email
```

Add the environment variables on Railway to fix this.
