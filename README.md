
## 🔒 Examiner-Safe Version

The tag `examiner-safe-v1` represents the final, verified, viva-safe state of ENVERSE.
All evaluations and demonstrations should be performed using this version.

# Enverse - Energy Intelligence Platform

> AI-powered appliance-level energy tracking with LLM insights

## Quick Start

### Local Development

```bash
# Backend
cd backend
pip install -r requirements.txt
export GOOGLE_API_KEY="your_key"
uvicorn app.main:app --reload

# Frontend
cd frontend/enverse-ui
npm install
npm run dev
```

### Deploy to Production

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment guide.

**Quick Deploy (Railway + Vercel):**

1. **Backend:** Connect repo to Railway → Add `GOOGLE_API_KEY` env variable
2. **Frontend:** Connect repo to Vercel → Add `VITE_API_URL` env variable pointing to Railway backend

Both platforms auto-deploy from GitHub commits.

## Environment Variables

### Backend
```env
GOOGLE_API_KEY=your_google_gemini_api_key
```

### Frontend
```env
VITE_API_URL=http://127.0.0.1:8000  # Local
# VITE_API_URL=https://your-backend.railway.app  # Production
```

## Architecture

- **Backend:** FastAPI (Python) - ML models, LLM chat, energy analytics
- **Frontend:** React + TypeScript + Vite - Real-time dashboard
- **ML:** XGBoost, Isolation Forest, NILM, SHAP explainability
- **LLM:** Google Gemini (Groq Llama fallback) for natural language insights

## Project Structure

```
Enverse/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI routes
│   │   ├── services/            # Business logic
│   │   └── ml/                  # ML models & training
│   └── data/                    # CSV energy logs
├── frontend/
│   └── enverse-ui/
│       └── src/
│           ├── components/      # React components
│           └── config/          # API configuration
└── DEPLOYMENT.md                # Complete deployment guide
```

## Key Features

- 📊 Real-time energy consumption tracking
- 🤖 AI-powered appliance disaggregation (NILM)
- 💬 Natural language chat for insights
- 🔍 Anomaly detection (rule-based + ML)
- 📈 Energy forecasting (tomorrow/next week)
- 💡 Explainable AI (SHAP values)
- 🔔 Smart alerts for unusual usage

## Deployment Status

✅ Production-ready configurations:
- Docker (multi-stage builds)
- Railway (backend)
- Vercel (frontend)
- Traditional VPS

## API Endpoints

- `GET /dashboard` - All metrics
- `GET /health` - System status
- `POST /chat` - LLM chat
- `GET /energy/forecast` - Predictions
- `GET /energy/ai-insights` - AI-generated insights
- `POST /api/estimate-energy` - What-if analysis

## License

Proprietary - Enverse Energy Intelligence Platform

## Support

For deployment issues, see [DEPLOYMENT.md](DEPLOYMENT.md) troubleshooting section.
