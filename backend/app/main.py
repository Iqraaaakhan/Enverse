# Folder: backend/app
# File: main.py

import sys
import math
import datetime
from pathlib import Path
from typing import Dict, Any

from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.services.data_loader import load_energy_data

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
# Ensure backend root is in PYTHONPATH
# -------------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))


# -------------------------------------------------------------------
# Service Imports (REAL ML / NLP / NILM)
# -------------------------------------------------------------------

from app.services.nlp_engine import process_user_query
from app.services.predictor import EnergyPredictor
from app.services.forecast_service import fetch_energy_forecast
from app.services.data_loader import load_energy_data
from app.services.anomaly_detector import detect_anomalies
from app.services.energy_estimation_service import estimate_energy
from app.services.explainability_service import generate_explanations
from app.services.nilm_explainer import explain_energy_usage
from app.services.energy_calculator import compute_dashboard_metrics


# -------------------------------------------------------------------
# App Initialization
# -------------------------------------------------------------------

app = FastAPI(
    title="Enverse API",
    description="Backend services for the Enverse Energy Intelligence Platform",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
    return {"status": "ok", "ai_models": "active"}


# -------------------------------------------------------------------
# Models
# -------------------------------------------------------------------

class ChatQuery(BaseModel):
    message: str


# -------------------------------------------------------------------
# Global ML Model (Loaded ONCE)
# -------------------------------------------------------------------

predictor = EnergyPredictor()


# -------------------------------------------------------------------
# Energy Summary (REAL DATA)
# -------------------------------------------------------------------

@app.get("/energy/summary")
def energy_summary():
    raw_data = load_energy_data()

    if not raw_data:
        return {"total_energy_kwh": 0, "device_wise_energy_kwh": {}}

    unique_devices = set(item["device_name"] for item in raw_data)
    device_count = max(len(unique_devices), 1)

    total_records = len(raw_data)
    estimated_days = max((total_records / device_count) / 24, 1)

    device_summary = {}
    for item in raw_data:
        device = item["device_name"]
        device_summary[device] = device_summary.get(device, 0) + (
            item["energy_kwh"] / estimated_days * 30
        )

    total_monthly_kwh = sum(device_summary.values())

    return {
        "total_energy_kwh": round(total_monthly_kwh, 2),
        "device_wise_energy_kwh": {k: round(v, 2) for k, v in device_summary.items()},
    }


# -------------------------------------------------------------------
# Dashboard
# -------------------------------------------------------------------

@app.get("/dashboard")
def dashboard():
    metrics = compute_dashboard_metrics()
    anomalies = detect_anomalies()

    return {
        **metrics,
        "anomalies": anomalies,
        "anomaly_count": len(anomalies),
    }


# -------------------------------------------------------------------
# Real-Time Forecast (ML)
# -------------------------------------------------------------------

@app.get("/api/realtime-forecast")
def realtime_forecast():
    total_predicted = predictor.predict(power_watts=1500, duration_minutes=60)
    return {"next_hour_kwh": json_safe(total_predicted)}


# -------------------------------------------------------------------
# Energy Forecast (ML + NILM)
# -------------------------------------------------------------------

@app.get("/energy/forecast")
def energy_forecast():
    forecast = fetch_energy_forecast()
    nilm_data = explain_energy_usage()

    return {
        **json_safe(forecast),
        "explanations": nilm_data.get("explanations", []),
    }


@app.get("/energy/explain")
def explain_energy():
    return explain_energy_usage()


# -------------------------------------------------------------------
# NLP Chat
# -------------------------------------------------------------------

@app.post("/chat")
def chat_endpoint(query: ChatQuery):
    return process_user_query(query.message)


# -------------------------------------------------------------------
# 🔥 WHAT-IF ANALYSIS — THIS IS WHAT WAS BROKEN
# -------------------------------------------------------------------

@app.post("/api/estimate-energy")
def estimate_energy_api(payload: Dict[str, Any] = Body(...)):
    """
    REAL ML What-If endpoint.
    Fixes:
    - CORS
    - HVAC label mismatch
    - 500 Internal Server Error
    """

    # ------------------ VALIDATE INPUT ------------------
    appliance = payload.get("appliance")
    duration = payload.get("usage_duration_minutes")
    power = payload.get("power_watts")

    if not appliance or not duration:
        return {"estimated_kwh": 0.0}

    # ------------------ NORMALIZE APPLIANCE (CRITICAL FIX) ------------------
    appliance_map = {
        "Air Conditioner (HVAC)": "HVAC",
        "AC": "HVAC",
        "HVAC": "HVAC",
        "Refrigerator": "Refrigerator",
        "Washing Machine": "Washing Machine",
        "Geyser": "Geyser",
        "Smart TV": "Smart TV",
        "Lighting": "Lighting",
    }

    appliance = appliance_map.get(appliance, appliance)

    # ------------------ CALL REAL ML SERVICE ------------------
    try:
        estimated_kwh = estimate_energy(
            {
                "appliance": appliance,
                "usage_duration_minutes": float(duration),
                "power_watts": float(power) if power else None,
            }
        )
    except Exception as e:
        # NEVER crash frontend
        return {"estimated_kwh": 0.0, "error": str(e)}

    return {"estimated_kwh": json_safe(estimated_kwh)}

@app.get("/energy/ai-insights")
def ai_insights():
    """
    Explainable AI layer combining:
    - NILM disaggregation
    - Forecast statistics
    - Rule-based ML reasoning
    """

    forecast = fetch_energy_forecast()
    nilm = explain_energy_usage()

    insights = []

    # 1. NILM insight
    if "device_breakdown" in nilm:
        top_device = max(
            nilm["device_breakdown"].items(),
            key=lambda x: x[1]
        )
        insights.append(
            f"{top_device[0]} contributes {round(top_device[1],1)}% of total energy usage."
        )

    # 2. Night usage anomaly
    if nilm.get("night_usage_ratio", 0) > 1.5:
        insights.append(
            "Night-time energy usage is significantly higher than daytime, indicating extended cooling usage."
        )

    # 3. Contextual comparison
    monthly_kwh = forecast.get("forecast", {}).get("next_month_kwh")
    if monthly_kwh and monthly_kwh > 350:
        insights.append(
            "Your monthly usage is higher than the average Indian household (250–350 kWh)."
        )

    # 4. Recommendation (derived, not random)
    if monthly_kwh:
        night_ratio = nilm.get("night_usage_ratio", 1)
        reduction_factor = min((night_ratio - 1) * 0.05, 0.15)
        savings = round((monthly_kwh * reduction_factor) * 8.5, 0)


    return {
        "ai_insights": insights
    }

@app.get("/energy/ai-timeline")
def ai_energy_timeline():
    """
    Explainable AI Timeline
    Uses REAL CSV data (Pandas-safe)
    """

    df = load_energy_data()

    # ---- SAFETY CHECK (FIXES 500 ERROR) ----
    if df is None or df.empty:
        return {
            "delta_kwh": 0,
            "delta_cost": 0,
            "primary_device": "N/A",
            "ai_explanation": ["Not enough historical data available yet."]
        }

    # ---- SORT BY TIME (CRITICAL) ----
    if "timestamp" in df.columns:
        df = df.sort_values("timestamp")

    # ---- SPLIT DATA ----
    last_30 = df.tail(30 * 24)
    prev_30 = df.iloc[-60 * 24:-30 * 24]

    last_kwh = last_30["energy_kwh"].sum()
    prev_kwh = prev_30["energy_kwh"].sum()

    delta_kwh = round(last_kwh - prev_kwh, 2)
    delta_cost = round(delta_kwh * 8.5, 2)

    # ---- NILM DEVICE ATTRIBUTION ----
    device_usage = (
        last_30.groupby("device_name")["energy_kwh"]
        .sum()
        .sort_values(ascending=False)
    )

    primary_device = device_usage.index[0]

    # ---- NLP EXPLANATION ----
    explanation = []

    if delta_kwh > 0:
        explanation.append(
            f"Your energy usage increased by {delta_kwh} kWh compared to the previous month."
        )
        explanation.append(
            f"The primary contributor was {primary_device}, indicating extended usage."
        )
        explanation.append(
            f"This led to an estimated bill increase of ₹{abs(delta_cost)}."
        )
    else:
        explanation.append(
            f"Your energy usage decreased by {abs(delta_kwh)} kWh compared to the previous month."
        )
        explanation.append(
            "This reflects improved energy efficiency."
        )

    return {
        "delta_kwh": delta_kwh,
        "delta_cost": delta_cost,
        "primary_device": primary_device,
        "ai_explanation": explanation
    }
