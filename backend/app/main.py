# Folder: backend/app
# File: main.py

import sys
from pathlib import Path
from pydantic import BaseModel
from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
import datetime

import math

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

# Ensure backend/ is in PYTHONPATH
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))

# Service Imports
from app.services.nlp_engine import process_user_query
from app.services.predictor import EnergyPredictor
from app.services.forecast_service import fetch_energy_forecast
from app.services.data_loader import load_energy_data
from app.services.anomaly_detector import detect_anomalies
from app.services.energy_estimation_service import estimate_energy
from app.services.explainability_service import generate_explanations
from app.services.nilm_explainer import explain_energy_usage

# Initialize App
app = FastAPI(
    title="Enverse API",
    description="Backend services for the Enverse Energy Intelligence Platform",
    version="2.0.0",
)

@app.get("/")
def root():
    return {"status": "Enverse backend running"}


# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class ChatQuery(BaseModel):
    message: str

# Global Instances
# This loads the XGBoost model once on startup
predictor = EnergyPredictor()

@app.get("/health")
def health_check():
    return {"status": "ok", "ai_models": "active"}

@app.get("/energy/summary")
def energy_summary():
    """
    Calculates energy usage based on ACTUAL data in the CSV.
    Fixes the '6 devices' bug by counting unique devices dynamically.
    """
    raw_data = load_energy_data()
    calculated = raw_data
    
    if not len(calculated):
        return {"total_energy_kwh": 0, "device_wise_energy_kwh": {}}

    # 1. Dynamic Device Counting (Real Logic)
    # Finds exactly how many unique devices exist (e.g., 16)
    unique_devices = set(item["device_name"] for item in calculated)
    device_count = len(unique_devices) if len(unique_devices) > 0 else 1

    # 2. Calculate Time Span
    # Total records / device_count = records per device
    # records per device / 24 (assuming hourly data) = days
    total_records = len(calculated)
    estimated_days = (total_records / device_count) / 24 
    
    # Safety check
    if estimated_days < 1: 
        estimated_days = 1

    # 3. Aggregation & Normalization
    device_summary = {}
    for item in calculated:
        device = item["device_name"]
        # Normalize to Monthly: (Actual kWh / Days Recorded) * 30 Days
        # This projects the monthly usage based on available data
        device_summary[device] = device_summary.get(device, 0) + (item["energy_kwh"] / estimated_days * 30)

    total_monthly_kwh = sum(device_summary.values())

    return {
        "total_energy_kwh": round(total_monthly_kwh, 2),
        "device_wise_energy_kwh": {k: round(v, 2) for k, v in device_summary.items()},
    }

from app.services.data_loader import load_energy_data
from app.services.anomaly_detector import detect_anomalies
from app.services.energy_calculator import compute_dashboard_metrics

@app.get("/dashboard")
def dashboard():
    metrics = compute_dashboard_metrics()
    anomalies = detect_anomalies()

    return {
        **metrics,
        "anomalies": anomalies,
        "anomaly_count": len(anomalies),
    }


@app.get("/api/realtime-forecast")
def realtime_forecast():
    """
    REAL AI: Uses the trained XGBoost model to predict the NEXT hour's consumption.
    This powers the 4th KPI card on the frontend.
    """
    # Simulate current conditions (in a real app, these come from sensors)
    # We predict for a standard load (1500W) to get a baseline 'next hour' cost
    total_predicted = predictor.predict(power_watts=1500, duration_minutes=60) 
    
    return {"next_hour_kwh": total_predicted}

@app.get("/energy/forecast")
def energy_forecast():
    # 1. Get Forecast (Random Forest / XGBoost)
    forecast = fetch_energy_forecast()
    
    # 2. Get Insights (NILM)
    # We use the NILM explainer here to provide text insights
    nilm_data = explain_energy_usage()
    explanations = nilm_data.get("explanations", [])
    
    return {
        **forecast,
        "explanations": explanations
    }

@app.get("/energy/explain")
def explain_energy():
    # Dedicated endpoint for NILM explanations
    return explain_energy_usage()

@app.post("/chat")
def chat_endpoint(query: ChatQuery):
    # NLP Engine (Sentence Transformers)
    return process_user_query(query.message)

@app.post("/api/estimate-energy")
def estimate_energy_api(payload: dict = Body(...)):
    # Uses the Random Forest model trained on Kaggle data for specific appliance estimation
    return {
        "estimated_kwh": estimate_energy(payload)
    }
