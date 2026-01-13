import sys
from pathlib import Path
from pydantic import BaseModel
from app.services.nlp_engine import process_user_query

# Ensure backend/ is in PYTHONPATH (fix for uvicorn --reload)
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))

from fastapi import FastAPI
from app.services.predictor import EnergyPredictor

app = FastAPI(
    title="Enverse API",
    description="Backend services for the Enverse Energy Intelligence Platform",
    version="1.0.0",
)
from app.services.predictor import EnergyPredictor
from app.services.forecast_service import fetch_energy_forecast

# Create a single predictor instance (loaded once)
predictor = EnergyPredictor()


@app.get("/health")
def health_check():
    """
    Health check endpoint.
    Used to verify that the backend is running correctly.
    """
    return {"status": "ok"}

from app.services.data_loader import load_energy_data


@app.get("/energy/raw")
def get_raw_energy_data():
    """
    Returns raw energy usage data from dataset.
    """
    return load_energy_data()

from app.services.energy_calculator import calculate_energy_kwh


@app.get("/energy/summary")
def energy_summary():
    """
    Returns total energy consumption and device-wise breakdown.
    """
    raw_data = load_energy_data()
    calculated = calculate_energy_kwh(raw_data)

    total_energy = sum(item["energy_kwh"] for item in calculated)

    device_summary = {}
    for item in calculated:
        device = item["device_name"]
        device_summary[device] = device_summary.get(device, 0) + item["energy_kwh"]

    return {
        "total_energy_kwh": round(total_energy, 3),
        "device_wise_energy_kwh": device_summary,
    }


from app.services.anomaly_detector import detect_anomalies
from app.services.explainability_service import generate_explanations


@app.get("/energy/anomalies")
def energy_anomalies():
    """
    Returns anomalous energy usage records.
    """
    raw_data = load_energy_data()
    calculated = calculate_energy_kwh(raw_data)
    anomalies = detect_anomalies(calculated)

    return {
        "anomaly_count": len(anomalies),
        "anomalies": anomalies
    }


@app.get("/energy/predict")
def predict_energy(power_watts: float, duration_minutes: float):
    """
    Predict future energy consumption (kWh)
    based on power and usage duration.
    """
    predicted_kwh = predictor.predict(
        power_watts=power_watts,
        duration_minutes=duration_minutes
    )

    return {
        "power_watts": power_watts,
        "duration_minutes": duration_minutes,
        "predicted_energy_kwh": predicted_kwh
    }

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
    """
    ML-based time-series forecast with explanations
    """
    raw_data = load_energy_data()
    calculated = calculate_energy_kwh(raw_data)

    forecast = fetch_energy_forecast()
    explanations = generate_explanations(calculated)

    return {
        **forecast,
        "explanations": explanations
    }

# --------------------------------------------------
# Explainable NILM (Why is my bill high?)
# --------------------------------------------------

from app.services.nilm_explainer import explain_energy_usage


@app.get("/energy/explain")
def explain_energy():
    """
    Explainable AI endpoint for NILM-based insights.
    Provides reasons behind high electricity consumption.
    """
    return explain_energy_usage()

from app.services.nlp_engine import process_user_query
from pydantic import BaseModel

class ChatQuery(BaseModel):
    message: str

@app.post("/chat")
def chat_with_enverse(query: ChatQuery):
    """
    NLP Chatbot endpoint for Enverse Bot
    """
    response = process_user_query(query.message)
    return response

# Add these imports at the top of main.py (Line 15 approx)
from pydantic import BaseModel
from app.services.nlp_engine import process_user_query

# Add this class and endpoint at the very bottom of main.py
class ChatMessage(BaseModel):
    message: str

@app.post("/chat")
def chat_endpoint(chat: ChatMessage):
    """
    Endpoint for the Semantic NLP Chatbot
    """
    return process_user_query(chat.message)
