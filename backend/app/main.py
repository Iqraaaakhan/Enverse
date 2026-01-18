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
# Ensure backend root is in PYTHONPATH
# -------------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))


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
from app.services.energy_calculator import compute_dashboard_metrics
from app.ml.metrics import get_latest_metrics
from app.services.shap_engine import explain_prediction_shap


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
# What-If Analysis
# -------------------------------------------------------------------

@app.post("/api/estimate-energy")
def estimate_energy_api(payload: Dict[str, Any] = Body(...)):
    appliance = payload.get("appliance")
    duration = payload.get("usage_duration_minutes")
    power = payload.get("power_watts")

    if not appliance or not duration:
        return {"estimated_kwh": 0.0}

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

    try:
        estimated_kwh = estimate_energy(
            {
                "appliance": appliance,
                "usage_duration_minutes": float(duration),
                "power_watts": float(power) if power else None,
            }
        )
    except Exception as e:
        return {"estimated_kwh": 0.0, "error": str(e)}

    return {"estimated_kwh": json_safe(estimated_kwh)}


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
    df = load_energy_data()

    if df is None or df.empty:
        return {
            "delta_kwh": 0,
            "delta_cost": 0,
            "primary_device": "N/A",
            "ai_explanation": ["Not enough historical data available yet."]
        }

    if "timestamp" in df.columns:
        df = df.sort_values("timestamp")

    last_30 = df.tail(30 * 24)
    prev_30 = df.iloc[-60 * 24:-30 * 24] if len(df) >= 60 * 24 else df.iloc[:0]

    last_kwh = last_30["energy_kwh"].sum()
    prev_kwh = prev_30["energy_kwh"].sum()

    delta_kwh = round(last_kwh - prev_kwh, 2)
    
    # Standard Tariff for Estimation
    TARIFF_RATE = 8.5
    delta_cost = round(delta_kwh * TARIFF_RATE, 2)

    if len(prev_30) > 0:
        last_by_device = last_30.groupby("device_name")["energy_kwh"].sum()
        prev_by_device = prev_30.groupby("device_name")["energy_kwh"].sum()
        
        all_devices = set(last_by_device.index) | set(prev_by_device.index)
        delta_by_device = {}
        
        for device in all_devices:
            last_val = last_by_device.get(device, 0)
            prev_val = prev_by_device.get(device, 0)
            delta_by_device[device] = round(last_val - prev_val, 2)
        
        if delta_by_device:
            primary_device = max(delta_by_device, key=lambda x: delta_by_device[x])
            primary_device_delta = delta_by_device[primary_device]
        else:
            primary_device = "Unknown"
            primary_device_delta = 0
    else:
        device_totals = last_30.groupby("device_name")["energy_kwh"].sum()
        primary_device = device_totals.idxmax() if len(device_totals) > 0 else "Unknown"
        primary_device_delta = 0

    explanation = []

    if delta_kwh > 0:
        explanation.append(
            f"↗️ Consumption increased by {delta_kwh} kWh compared to the previous period."
        )
        
        if len(prev_30) > 0 and primary_device_delta > 0:
            explanation.append(
                f"📌 {primary_device} contributed most to this increase (+{primary_device_delta} kWh)."
            )
            explanation.append(
                f"💰 Estimated bill impact: +₹{abs(delta_cost)}."
            )
        else:
            explanation.append(
                f"💰 Total estimated bill increase: ₹{abs(delta_cost)}."
            )
    else:
        explanation.append(
            f"↘️ Consumption decreased by {abs(delta_kwh)} kWh compared to the previous period."
        )
        explanation.append(
            f"✓ Estimated savings: ₹{abs(delta_cost)}."
        )

    return {
        "delta_kwh": delta_kwh,
        "delta_cost": delta_cost,
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