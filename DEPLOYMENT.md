# Enverse Deployment Guide

## Pre-Deployment Checklist

All hardcoded URLs have been replaced with environment variables:
- Frontend uses `VITE_API_URL` from `.env`
- Backend CORS is configured for production domains
- API configuration is centralized in `frontend/enverse-ui/src/config/api.ts`

---

## Recommended Free Setup

Frontend: **Vercel**

Backend: **Render Web Service**

This is the simplest free-tier path for a recruiter-facing demo and matches the current codebase.

---

## 1) Backend on Render

### Render service settings

- `Name`: `enverse-backend`
- `Environment`: `Python 3`
- `Root Directory`: `backend`
- `Build Command`: `pip install -r requirements.txt`
- `Start Command`: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Backend environment variables

```env
GROQ_API_KEY=your_groq_api_key
JWT_SECRET=your_random_secret_key
SENDGRID_API_KEY=your_sendgrid_api_key
SENDER_EMAIL=your_verified_sendgrid_sender_email
SMTP_FALLBACK_ENABLED=false
FRONTEND_ORIGIN=https://your-vercel-app.vercel.app
AUTH_DB_PATH=/tmp/auth.db
```

### Deploy steps

1. Push the repo to GitHub.
2. Create a new Render Web Service from the repo.
3. Set the root directory to `backend`.
4. Paste the environment variables above.
5. Deploy and copy the public Render URL.

---

## 2) Frontend on Vercel

### Vercel settings

- `Root Directory`: `frontend/enverse-ui`
- `Build Command`: default Vercel/Vite build is fine
- `Output Directory`: `dist`

### Frontend environment variable

```env
VITE_API_URL=https://your-render-backend.onrender.com
```

### Deploy steps

1. Open the Vercel project.
2. Add `VITE_API_URL` using the Render backend URL.
3. Redeploy the frontend.

---

## 3) Local Verification

Backend:

```bash
cd backend
set -a
source .env
set +a
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Frontend:

```bash
cd frontend/enverse-ui
npm run dev -- --host 127.0.0.1 --port 5173
```

Then open `http://127.0.0.1:5173` and verify login reaches the backend.

---

## 4) Post-Deployment Checks

```bash
curl https://your-render-backend.onrender.com/health
curl https://your-render-backend.onrender.com/dashboard
```

---

## Notes

- Keep `FRONTEND_ORIGIN` set to the exact Vercel domain.
- Keep `AUTH_DB_PATH=/tmp/auth.db` for Render.
- Use SendGrid API for OTP email on Render. Render free web services block outbound SMTP ports `25`, `465`, and `587`, so Gmail SMTP should remain disabled there.
- Verify `SENDER_EMAIL` in SendGrid before testing OTP delivery.
- The auth DB is SQLite-backed, so it is fine for a portfolio demo but not durable storage.
