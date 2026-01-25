# Enverse Deployment Guide

## ✅ Pre-Deployment Checklist

All hardcoded URLs have been replaced with environment variables:
- ✅ Frontend uses `VITE_API_URL` from `.env`
- ✅ Backend CORS configured for production domains
- ✅ API configuration centralized in `frontend/enverse-ui/src/config/api.ts`

---

## 🚀 Deployment Options

### **Option 1: Railway + Vercel (Recommended)**

#### **Backend on Railway**

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Deploy to Railway**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway auto-detects `railway.json`
   - Add environment variables:
     ```
     GOOGLE_API_KEY=your_gemini_api_key
     SENDER_EMAIL=your-email@gmail.com
     SENDER_PASSWORD=your-gmail-app-password
     SMTP_SERVER=smtp.gmail.com
     SMTP_PORT=587
     JWT_SECRET=your-random-secret-key
     ```
   - **For Gmail:** Enable 2FA → Generate app password at https://myaccount.google.com/apppasswords
   - Deploy automatically starts

3. **Get Backend URL**
   - Railway provides URL: `https://enverse-backend-xxxxx.railway.app`
   - Test: `curl https://your-backend-url/health`

#### **Frontend on Vercel**

1. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project" → Select repo
   - Set root directory: `frontend/enverse-ui`
   - Vercel auto-detects Vite config

2. **Add Environment Variable**
   - In Vercel dashboard → Settings → Environment Variables
   - Add: `VITE_API_URL=https://your-backend-url.railway.app`
   - Redeploy

3. **Update Backend CORS**
   - In `backend/app/main.py`, replace:
     ```python
     allow_origins=["*"]
     ```
     with:
     ```python
     allow_origins=["https://your-frontend.vercel.app"]
     ```
   - Commit and push (Railway auto-redeploys)

---\
  -e GOOGLE_API_KEY=your_key \
  -e SENDER_EMAIL=your-email@gmail.com \
  -e SENDER_PASSWORD=your-app-password \
 

### **Option 2: Docker + Any Cloud**

#### **Build Images**

```bash
# Backend
docker build -f Dockerfile.backend -t enverse-backend .
docker run -p 8000:8000 -e GOOGLE_API_KEY=your_key enverse-backend

# Frontend
docker build -f Dockerfile.frontend -t enverse-frontend .
docker run -p 80:80 enverse-frontend
```

#### **Deploy to:**
- **AWS ECS/Fargate**: Use ECR for image registry
- **Google Cloud Run**: `gcloud run deploy`
- **DigitalOcean App Platform**: Connect GitHub repo
- **Fly.io**: `fly deploy`

---

### **Option 3: Traditional VPS (Ubuntu)**

```bash
# SSH into server
ssh user@your-server-ip

# Clone repo
git clone https://github.com/yourusername/enverse.git
cd enverse

# Backend setup
cd backend
export SENDER_EMAIL=your-email@gmail.com
export SENDER_PASSWORD=your-app-password
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
export GOOGLE_API_KEY=your_key

# Run with systemd
sudo nano /etc/systemd/system/enverse-backend.service
```

**Systemd service file:**
```ini
[Unit]
Description=Enverse Backend API
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/enverse/backend
Environment="GOOGLE_API_KEY=your_key"
ExecStart=/home/ubuntu/enverse/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl start enverse-backend
sudo systemctl enable enverse-backend

# Frontend setup
cd ../frontend/enverse-ui
npm install
npm run build

# Serve with Nginx
sudo cp -r dist/* /var/www/html/
```

---

## 🔐 Environment Variables

### **Backend**
```env
GOOGLE_API_KEY=your_google_gemini_api_key
PORT=8000  # Optional
CORS_ORIGINS=https://your-frontend.com  # Optional
```

### **Frontend**
```env
VITE_API_URL=https://your-backend-url.com
```

---

## 🧪 Post-Deployment Testing

```bash
# Test backend health
curl https://your-backend-url/health

# Test dashboard endpoint
curl https://your-backend-url/dashboard

# Test frontend
open https://your-frontend-url
```

---

## 🔧 Troubleshooting

### **CORS Errors**
- Verify `VITE_API_URL` in Vercel env variables
- Check `allow_origins` in `backend/app/main.py`

### **API Key Not Found**
- Ensure `GOOGLE_API_KEY` is set in Railway env variables
- Restart backend service after adding

### **404 on API Calls**
- Confirm frontend is using correct `VITE_API_URL`
- Check browser console for actual URL being called

### **ML Models Missing**
- Ensure `backend/app/ml/models/` directory exists
- Models are generated on first run (may take time)

---

## 📊 Monitoring

**Railway:**
- Built-in logs and metrics
- Set up alerts for downtime

**Vercel:**
- Analytics dashboard
- Function logs

**Custom:**
- Add Sentry for error tracking
- Use Uptime Robot for availability monitoring

---

## 🔄 CI/CD Setup (Optional)

**GitHub Actions example:**

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        run: vercel --prod
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

---

## 📝 Production Checklist

- [ ] Replace `allow_origins=["*"]` with specific domains
- [ ] Set `GOOGLE_API_KEY` in production
- [ ] Configure `VITE_API_URL` in frontend env
- [ ] Enable HTTPS (Vercel/Railway do this automatically)
- [ ] Test all endpoints after deployment
- [ ] Set up monitoring/alerts
- [ ] Configure custom domain (optional)
- [ ] Enable rate limiting (optional)
- [ ] Add authentication middleware (optional)

---

## 🎯 Estimated Deployment Time

- **Railway + Vercel**: ~10 minutes
- **Docker**: ~30 minutes (includes image builds)
- **VPS**: ~1 hour (includes server setup)

---

## 💰 Cost Estimates

| Platform | Backend | Frontend | Total/Month |
|----------|---------|----------|-------------|
| Railway + Vercel | $5 | Free | $5 |
| DigitalOcean | $6 | $6 | $12 |
| AWS (t3.small) | ~$15 | $1 (S3) | $16 |

---

**Need help?** Open an issue or check Railway/Vercel documentation.
