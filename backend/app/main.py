import sys
import math
import datetime
from pathlib import Path
from typing import Dict, Any

from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd 


# -------------------------------------------------------------------
# Utility
# -------------------------------------------------------------------

def json_safe(obj):
    if isinstance(obj, float):
        if math.isinf(obj) or math.isnan(obj):
            return 0.0
        return obj
    if isinstance(obj, dict):
        return {k: json_safe(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [json_safe(v) for v in obj]
    return obj


# -------------------------------------------------------------------
# Setup Python path for imports
# -------------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent
PARENT_DIR = BASE_DIR.parent

if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))
if str(PARENT_DIR) not in sys.path:
    sys.path.insert(0, str(PARENT_DIR))


# -------------------------------------------------------------------
# Service Imports
# -------------------------------------------------------------------

from app.services.nlp_engine import process_user_query
from app.services.predictor import EnergyPredictor
from app.services.forecast_service import fetch_energy_forecast
from app.services.data_loader import load_energy_data
from app.services.anomaly_detector import detect_anomalies
from app.services.energy_estimation_service import estimate_energy
from app.services.explainability_service import generate_explanations
from app.services.nilm_explainer import explain_energy_usage
from app.services.auth_service import generate_otp, send_otp_email, create_jwt_token, verify_jwt_token
from app.services.alert_service import get_active_alerts
from app.services.energy_calculator import compute_dashboard_metrics
from app.ml.metrics import get_latest_metrics
from app.services.shap_engine import explain_prediction_shap
from app.services.billing_service import calculate_electricity_bill
from auth_db import init_db, get_or_create_user, store_otp, verify_otp as verify_otp_db


# -------------------------------------------------------------------
# App Initialization
# -------------------------------------------------------------------

app = FastAPI(
    title="Enverse API",
    description="Backend services for the Enverse Energy Intelligence Platform",
    version="2.0.0",
)

# CORS Configuration
# For local development, allow all origins
# For production, replace "*" with your frontend domain:
# allow_origins=["https://your-frontend.vercel.app", "https://www.yourdomain.com"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 🚨 Change to specific domains in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------------------------------------------------
# Health & Root
# -------------------------------------------------------------------

@app.get("/")
def root():
    return {"status": "Enverse backend running"}

@app.get("/health")
def health_check():
    """Lightweight health check - returns immediately without loading ML models"""
    return {"status": "ok", "ai_models": "active"}


# -------------------------------------------------------------------
# Authentication Endpoints
# -------------------------------------------------------------------

# Initialize auth database on startup
try:
    init_db()
    print("✅ Auth database initialized successfully")
except Exception as e:
    print(f"⚠️ Auth database initialization warning: {e}")
    import traceback
    traceback.print_exc()

class SendOTPRequest(BaseModel):
    email: str

class VerifyOTPRequest(BaseModel):
    email: str
    otp: str

@app.post("/auth/send-otp")
def send_otp(request: SendOTPRequest):
    """Send OTP to user email"""
    email = request.email.lower().strip()
    
    # Validate email format
    if "@" not in email or "." not in email:
        return {"success": False, "message": "Invalid email format"}
    
    # Generate OTP
    otp = generate_otp()
    
    # Store in database
    store_otp(email, otp, expires_in_minutes=10)
    
    # Send email
    email_sent = send_otp_email(email, otp)
    
    if not email_sent:
        return {
            "success": False,
            "message": "Email service not configured. Please contact administrator."
        }
    
    return {
        "success": True,
        "message": f"OTP sent to {email}"
    }

@app.post("/auth/verify-otp")
def verify_otp(request: VerifyOTPRequest):
    """Verify OTP and return JWT token"""
    email = request.email.lower().strip()
    otp = request.otp.strip()
    
    # Verify OTP
    is_valid = verify_otp_db(email, otp)
    
    if not is_valid:
        return {
            "success": False,
            "message": "Invalid or expired OTP"
        }
    
    # Get or create user
    user = get_or_create_user(email)
    
    # Generate JWT token
    token = create_jwt_token(email)
    
    return {
        "success": True,
        "message": "Login successful",
        "token": token,
        "user": {
            "email": user["email"],
            "id": user["id"]
        }
    }

@app.post("/auth/verify-token")
def verify_token(token: str = Body(..., embed=True)):
    """Verify JWT token validity"""
    payload = verify_jwt_token(token)
    
    if not payload:
        return {"valid": False}
    
    return {
        "valid": True,
        "email": payload.get("email")
    }


# -------------------------------------------------------------------
# Models
# -------------------------------------------------------------------

class ChatQuery(BaseModel):
    message: str


# -------------------------------------------------------------------
# Global ML Model
# -------------------------------------------------------------------

predictor = EnergyPredictor()


# -------------------------------------------------------------------
# Dashboard (Single Source of Truth)
# -------------------------------------------------------------------

@app.get("/dashboard")
def dashboard():
    metrics = compute_dashboard_metrics()
    anomalies = detect_anomalies()

    return {
        **metrics,
        "anomalies": anomalies,
        "anomaly_count": len(anomalies),
        # Ensure savings is passed through
        "estimated_savings": metrics.get("savings_amount", 0) 
    }


# -------------------------------------------------------------------
# Real-Time Forecast
# -------------------------------------------------------------------

@app.get("/api/realtime-forecast")
def realtime_forecast():
    total_predicted = predictor.predict(power_watts=1500, duration_minutes=60)
    return {"next_hour_kwh": json_safe(total_predicted)}


# -------------------------------------------------------------------
# Energy Forecast
# -------------------------------------------------------------------

# ... existing imports ...

# -------------------------------------------------------------------
# Energy Forecast Endpoint (FIXED)
# -------------------------------------------------------------------

@app.get("/energy/forecast")
def energy_forecast():
    # 1. Fetch the CLEAN forecast data (which now has the correct observations)
    forecast = fetch_energy_forecast()
    
    # ❌ REMOVED: nilm_data = explain_energy_usage() 
    # This was the line injecting the "AC is dominant" lie.
    
    return {
        **json_safe(forecast),
        # 2. Map the new 'ai_observations' to the frontend's expected 'explanations' key
        "explanations": forecast.get("ai_observations", [])
    }

# -------------------------------------------------------------------
# NLP Chat (LLM-Powered with Per-Session Isolation)
# -------------------------------------------------------------------

from app.services.llm_service import process_chat_message

@app.post("/chat")
def chat_endpoint(query: ChatQuery):
    # Use LLM-powered chatbot with per-session isolation
    # session_id defaults to "default" for single-user, but can be per-user in production
    response_text = process_chat_message(query.message, session_id="default")
    return {
        "answer": response_text,
        "status": "success"
    }


# -------------------------------------------------------------------
# What-If Analysis
# -------------------------------------------------------------------

# ... imports ...

@app.post("/api/estimate-energy")
def estimate_energy_api(payload: Dict[str, Any] = Body(...)):
    # Extract params
    appliance = payload.get("appliance", "Unknown") # Critical for duty cycle
    duration = payload.get("usage_duration_minutes", 0)
    power = payload.get("power_watts", 0)

    # Instantiate Predictor
    pred_service = EnergyPredictor() 
    
    # Get Result
    result = pred_service.predict_energy(
        power_watts=power,
        duration_minutes=duration,
        appliance=appliance,
        mode="what_if"
    )

    return {
        "estimated_kwh": json_safe(result["energy_kwh"]),
        "calculation_method": result["method"],
        "reason": result["reason"]
    }

# -------------------------------------------------------------------
# 🔥 AI INSIGHTS (MATHEMATICALLY CORRECT)
# -------------------------------------------------------------------

@app.get("/energy/ai-insights")
def ai_insights():
    """
    Returns structured insight objects.
    ✅ FIXED: Uses Daily Rate Comparison (kWh/day) to handle partial periods correctly.
    """
    
    # 1. GET CURRENT OBSERVED DATA
    metrics = compute_dashboard_metrics()
    total_energy = metrics.get("total_energy_kwh", 0)
    device_breakdown = metrics.get("device_wise_energy_kwh", {})
    night_percent = metrics.get("night_usage_percent", 0)
    
    insights = []

    # === INSIGHT 1: DOMINANT LOAD ===
    if device_breakdown and total_energy > 0:
        top_device = max(device_breakdown.items(), key=lambda x: x[1])
        
        insights.append({
            "type": "dominant_load",
            "device": top_device[0], 
            "value": top_device[1],
            "percentage": round((top_device[1] / total_energy) * 100, 1)
        })

    # === INSIGHT 2: CONSUMPTION STATUS (DAILY RATE COMPARISON) ===
    if total_energy > 0:
        try:
            full_df = load_energy_data()
            if not full_df.empty and "timestamp" in full_df.columns:
                full_df["timestamp"] = pd.to_datetime(full_df["timestamp"])
                
                # A. Historical Daily Rate (The Baseline)
                hist_days = max((full_df["timestamp"].max() - full_df["timestamp"].min()).days, 1)
                hist_total = full_df["energy_kwh"].sum()
                hist_daily_rate = hist_total / hist_days
                
                # B. Current Period Daily Rate
                # We replicate the 30-day filter to find exact days in current window
                latest_date = full_df["timestamp"].max()
                start_date = latest_date - datetime.timedelta(days=30)
                current_window_df = full_df[full_df["timestamp"] >= start_date]
                
                if not current_window_df.empty:
                    curr_days = max((current_window_df["timestamp"].max() - current_window_df["timestamp"].min()).days, 1)
                    curr_daily_rate = total_energy / curr_days
                    
                    # C. Compare Rates (110% threshold)
                    # This correctly flags high intensity even if data is sparse
                    status = "high" if curr_daily_rate > (hist_daily_rate * 1.1) else "normal"
                else:
                    status = "normal"
            else:
                status = "normal"
        except Exception as e:
            print(f"Insight Calc Error: {e}")
            status = "normal"
        
        # Find driver if high
        driver = None
        if status == "high" and device_breakdown:
             driver = max(device_breakdown.items(), key=lambda x: x[1])[0]

        insights.append({
            "type": "consumption_status",
            "status": status,
            "total_kwh": total_energy,
            "driver": driver
        })

    # === INSIGHT 3: NIGHT USAGE ===
    insights.append({
        "type": "night_usage",
        "percentage": night_percent
    })
    
    return {
        "ai_insights": insights
    }


# -------------------------------------------------------------------
# AI Timeline (Clean Costing)
# -------------------------------------------------------------------

@app.get("/energy/ai-timeline")
def ai_energy_timeline():
    # REUSE the calculator logic to ensure 100% match with dashboard
    metrics = compute_dashboard_metrics()
    
    if metrics["total_energy_kwh"] == 0:
        return {
            "delta_kwh": 0,
            "delta_cost": 0,
            "primary_device": "N/A",
            "ai_explanation": ["Not enough historical data available yet."]
        }
    
    delta_kwh = metrics["delta_kwh"]
    savings = metrics["savings_amount"]
    
    # Determine primary device from device breakdown
    device_breakdown = metrics.get("device_wise_energy_kwh", {})
    if device_breakdown:
        primary_device = max(device_breakdown, key=device_breakdown.get)
    else:
        primary_device = "Unknown"
    
    explanation = []
    if delta_kwh > 0:
        explanation.append(f"↗️ Consumption increased by {abs(delta_kwh):.2f} kWh.")
        explanation.append(f"💰 Estimated bill impact: +₹{abs(savings):.2f}.")
    else:
        explanation.append(f"↘️ Consumption decreased by {abs(delta_kwh):.2f} kWh.")
        explanation.append(f"✓ Estimated savings: ₹{abs(savings):.2f}.")

    return {
        "delta_kwh": delta_kwh,
        "delta_cost": savings,  # This is slab-based prev_bill - current_bill
        "primary_device": primary_device,
        "ai_explanation": explanation
    }


# -------------------------------------------------------------------
# MLOps / Evaluation Endpoint
# -------------------------------------------------------------------

@app.get("/api/model-health")
def model_health():
    return get_latest_metrics()


# -------------------------------------------------------------------
# Explainability Endpoint
# -------------------------------------------------------------------

@app.post("/api/explain/prediction")
def explain_prediction(payload: Dict[str, Any] = Body(...)):
    return explain_prediction_shap(payload)


# -------------------------------------------------------------------
# Smart Alert System
# -------------------------------------------------------------------

@app.get("/api/alerts")
def get_alerts():
    """
    Returns active alerts for devices running continuously.
    Uses test dataset for alert demonstrations.
    """
    test_csv_path = BASE_DIR / "data" / "energy_usage_test.csv"
    return get_active_alerts(csv_path=str(test_csv_path))


@app.get("/api/alerts/test")
def get_alerts_test():
    """
    TEST ENDPOINT - Demonstrates alert behavior with demo dataset.
    Uses energy_usage_test.csv with recent timestamps and continuous usage.
    
    ⚠️ FOR DEMONSTRATION ONLY - Does not affect production data
    """
    test_csv_path = BASE_DIR / "data" / "energy_usage_test.csv"
    
    if not test_csv_path.exists():
        return {
            "error": "Test dataset not found",
            "path": str(test_csv_path),
            "message": "energy_usage_test.csv must exist in backend/data/"
        }
    
    return get_active_alerts(csv_path=str(test_csv_path))


# ... imports
from app.services.llm_service import process_chat_message 

# ... existing code ...

# Update ChatQuery to accept session_id
class ChatQuery(BaseModel):
    message: str
    session_id: str = "default"

# ... existing code ...

@app.post("/chat")
def chat_endpoint(query: ChatQuery):
    # Pass session_id to the service
    response_text = process_chat_message(query.message, query.session_id)
    
    return {
        "answer": response_text,
        "status": "success"
    }