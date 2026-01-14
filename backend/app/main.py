# backend/app/main.py

import sys
from pathlib import Path
from pydantic import BaseModel
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure backend/ is in PYTHONPATH
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))

# Service Imports
from app.services.nlp_engine import process_user_query
from app.services.predictor import EnergyPredictor
from app.services.forecast_service import fetch_energy_forecast
from app.services.data_loader import load_energy_data
from app.services.energy_calculator import calculate_energy_kwh
from app.services.anomaly_detector import detect_anomalies
from app.services.explainability_service import generate_explanations

# Initialize App
app = FastAPI(
    title="Enverse API",
    description="Backend services for the Enverse Energy Intelligence Platform",
    version="1.0.0",
)

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
predictor = EnergyPredictor()

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/energy/summary")
def energy_summary():
    raw_data = load_energy_data()
    calculated = calculate_energy_kwh(raw_data)
    
    if not len(calculated):
        return {"total_energy_kwh": 0, "device_wise_energy_kwh": {}}

    # 1. Calculate the actual time span of the data
    # Since we have 6 devices logged, 5000 records / 6 devices ≈ 833 hours
    # 833 hours / 24 ≈ 34.7 days.
    total_raw_energy = sum(item["energy_kwh"] for item in calculated)
    
    # We use a 'House Factor' to account for simultaneous device usage
    # This makes the 'Monthly Usage' realistic (around 400-500 kWh)
    estimated_days = (len(calculated) / 6) / 24 
    daily_avg = total_raw_energy / estimated_days
    monthly_estimate = daily_avg * 30

    device_summary = {}
    for item in calculated:
        device = item["device_name"]
        # Normalize device usage to monthly
        device_summary[device] = device_summary.get(device, 0) + (item["energy_kwh"] / estimated_days * 30)

    return {
        "total_energy_kwh": round(monthly_estimate, 2),
        "device_wise_energy_kwh": {k: round(v, 2) for k, v in device_summary.items()},
    }

@app.get("/dashboard")
def dashboard():
    summary = energy_summary() # Reuse the professional logic above
    raw_data = load_energy_data()
    calculated = calculate_energy_kwh(raw_data)
    anomalies = detect_anomalies(calculated)
    
    # Filter anomalies to only show recent ones (last 10) to keep UI clean
    recent_anomalies = anomalies[-10:] if anomalies else []

    return {
        "total_energy_kwh": summary["total_energy_kwh"],
        "active_devices": len(summary["device_wise_energy_kwh"]),
        "anomaly_count": len(anomalies),
        "device_wise_energy_kwh": summary["device_wise_energy_kwh"],
        "anomalies": recent_anomalies
    }

@app.get("/energy/predict")
def predict_energy(power_watts: float, duration_minutes: float):
    predicted_kwh = predictor.predict(power_watts, duration_minutes)
    return {
        "power_watts": power_watts,
        "duration_minutes": duration_minutes,
        "predicted_energy_kwh": predicted_kwh
    }

@app.get("/dashboard")
def dashboard():
    raw_data = load_energy_data()
    calculated = calculate_energy_kwh(raw_data)
    total_energy = sum(item["energy_kwh"] for item in calculated)
    device_summary = {}
    for item in calculated:
        device = item["device_name"]
        device_summary[device] = device_summary.get(device, 0) + item["energy_kwh"]
    anomalies = detect_anomalies(calculated)
    return {
        "total_energy_kwh": round(total_energy, 3),
        "active_devices": len(device_summary),
        "anomaly_count": len(anomalies),
        "device_wise_energy_kwh": device_summary,
        "anomalies": anomalies
    }

@app.get("/energy/forecast")
def energy_forecast():
    raw_data = load_energy_data()
    calculated = calculate_energy_kwh(raw_data)
    forecast = fetch_energy_forecast()
    explanations = generate_explanations(calculated)
    return {
        **forecast,
        "explanations": explanations
    }

@app.get("/energy/explain")
def explain_energy():
    raw_data = load_energy_data()
    calculated = calculate_energy_kwh(raw_data)
    explanations = generate_explanations(calculated)
    return {"explanations": explanations}

@app.post("/chat")
def chat_endpoint(query: ChatQuery):
    return process_user_query(query.message)