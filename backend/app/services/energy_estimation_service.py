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

def estimate_energy(payload):
    power = float(payload.get("rated_power_watts", 1500))
    minutes = float(payload.get("duration_minutes", 60))

    physics_kwh = (power / 1000) * (minutes / 60)

    ml_factor = model.predict([features(payload)])[0]
    ml_factor = max(0.9, min(1.1, ml_factor))  # clamp realism

    return round(physics_kwh * ml_factor, 3)
