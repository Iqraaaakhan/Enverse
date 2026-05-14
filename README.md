 # Enverse - Energy Intelligence Platform

AI-powered appliance-level energy tracking with LLM-driven natural language
insights

Quick Start

Local Development

```bash

Backend

cd backend pip install -r requirements.txt cp .env.example .env # Add your API
keys uvicorn app.main:app --reload

Frontend

cd frontend/enverse-ui npm install npm run dev ```

Environment Variables

Backend

```env GROQ_API_KEY=your_groq_api_key SENDGRID_API_KEY=your_sendgrid_api_key
SENDER_EMAIL=your_verified_sender_email JWT_SECRET=your_jwt_secret_key ```

Frontend

```env VITE_API_URL=http://127.0.0.1:8000 # Local

VITE_API_URL=https://your-app.railway.app  # Production

```

Architecture

  - Backend: FastAPI (Python) — ML models, LLM chat, energy analytics, OTP auth
  - Frontend: React + TypeScript + Vite — Real-time dashboard, charts, alert
    notifications
  - ML: XGBoost (forecasting + NILM), Isolation Forest (anomaly detection), SHAP
    (explainability)
  - LLM: Llama 3.3 via Groq API — natural language energy queries with
    per-session conversation memory
  - Auth: OTP-based login via SendGrid + JWT tokens

Project Structure

``` Enverse/ ├── backend/ │ ├── app/ │ │ ├── main.py # FastAPI routes │ │ ├──
services/ # Business logic │ │ │ ├── llm_service.py │ │ │ ├── alert_service.py │
│ │ ├── forecast_service.py │ │ │ ├── anomaly_detector.py │ │ │ └──
auth_service.py │ │ └── ml/ # ML models & training │ │ ├── train_forecast.py │ │
├── train_nilm_model.py │ │ └── train_anomaly_model.py │ ├── auth_db.py # SQLite
OTP & user store │ └── data/ # Energy CSV logs ├── frontend/ │ └── enverse-ui/ │
└── src/ │ ├── components/ # React components │ ├── pages/ # Login page │ └──
config/ # API configuration └── README.md ```

Key Features

  - 📊 Real-time appliance-level energy tracking
  - 🤖 NILM disaggregation — identifies individual device consumption from
    aggregate data
  - 💬 Natural language chat (Llama 3.3 via Groq) with per-session conversation
    memory
  - 🔍 Anomaly detection — Isolation Forest ML

  - rule-based fallback

  - 📈 7-day recursive energy forecasting (XGBoost)
  - 💡 SHAP explainability for model predictions
  - 🔔 Smart alerts — continuous device monitoring with Web Audio API
    notifications
  - 🔐 OTP-based passwordless auth + JWT sessions

ML Model Performance

| Model                      | Dataset                      | R² Score | MAE                    |
| -------------------------- | ---------------------------- | -------- | ---------------------- |
| Energy Forecast XGBoost    | Kaggle Home Data (80/20)     | 0.9971   | 0.0346                 |
| NILM Disaggregator XGBoost | Appliance Signatures (75/25) | 0.9975   | 0.0409                 |
| Isolation Forest           | Unsupervised Time-Series     | —        | 97% variance explained |

Deployment

  - Backend: Railway (auto-deploy from GitHub)
  - Frontend: Vercel (auto-deploy from GitHub)

API Endpoints

| Method | Endpoint             | Description                  |
| ------ | -------------------- | ---------------------------- |
| GET    | /dashboard           | All energy metrics           |
| GET    | /health              | System status                |
| POST   | /chat                | LLM natural language query   |
| GET    | /energy/forecast     | 7-day XGBoost prediction     |
| GET    | /energy/ai-insights  | Pattern recognition insights |
| GET    | /api/alerts          | Active device alerts         |
| POST   | /api/estimate-energy | What-if analysis             |
| GET    | /api/model-health    | ML model metrics             |
| POST   | /auth/send-otp       | Send login OTP               |
| POST   | /auth/verify-otp     | Verify OTP + get JWT         |

