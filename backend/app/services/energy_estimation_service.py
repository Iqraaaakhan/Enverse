import joblib
import pandas as pd
from pathlib import Path
import os

# Robust Path Resolution
BASE_DIR = Path(__file__).resolve().parents[2]
MODEL_PATH = BASE_DIR / "app" / "ml" / "models" / "energy_estimation_model.pkl"

model = None

def load_model():
    global model
    if MODEL_PATH.exists():
        try:
            model = joblib.load(MODEL_PATH)
            print(f"✅ ML Model loaded from {MODEL_PATH}")
        except Exception as e:
            print(f"❌ Failed to load model: {e}")
    else:
        print(f"⚠️ Model not found at {MODEL_PATH}. Please run 'python -m app.ml.train_energy_model'")

# Load on startup
load_model()

def estimate_energy(payload: dict):
    # 1. Force duration to 60 mins for the model input to get "Average Hourly Consumption"
    model_payload = payload.copy()
    model_payload['usage_duration_minutes'] = 60 
    
    df = pd.DataFrame([model_payload])
    
    # 2. Model predicts kWh for 1 hour (which effectively equals kW power)
    predicted_hourly_kwh = float(model.predict(df)[0])
    
    # 3. Apply Physics Formula: Energy = Power * Time
    # (predicted_hourly_kwh is effectively kW)
    actual_duration_hours = payload['usage_duration_minutes'] / 60
    final_energy = predicted_hourly_kwh * actual_duration_hours
    
    return round(max(0.001, final_energy), 4)