import pandas as pd
import joblib
from pathlib import Path
from typing import List, Dict

# Path Setup
BASE_DIR = Path(__file__).resolve().parents[2]
MODEL_PATH = BASE_DIR / "app" / "ml" / "models" / "anomaly_isolation_forest.pkl"

model = None

def load_model():
    global model
    if MODEL_PATH.exists():
        try:
            model = joblib.load(MODEL_PATH)
            print(f"✅ Anomaly Model loaded")
        except Exception as e:
            print(f"❌ Failed to load anomaly model: {e}")

load_model()

def detect_anomalies(records: List[Dict]) -> List[Dict]:
    """
    Uses Isolation Forest to detect anomalies in real-time data.
    Returns records that are statistically outliers.
    """
    if not records:
        return []

    # Fallback to rule-based if model isn't ready (Safety net)
    if model is None:
        return [r for r in records if float(r.get("energy_kwh", 0)) > 10.0]

    try:
        # Prepare DataFrame for ML Model
        # We need to map the incoming dict keys to the training feature names
        # Incoming: device_name, duration_minutes, energy_kwh
        # Training: appliance, usage_duration_minutes, energy_consumption_kWh, occupancy_flag
        
        df = pd.DataFrame(records)
        
        # Rename columns to match training data
        ml_input = pd.DataFrame()
        ml_input['appliance'] = df['device_name']
        ml_input['usage_duration_minutes'] = df['duration_minutes']
        ml_input['energy_consumption_kWh'] = df['energy_kwh']
        # Assume occupied (1) for live dashboard data if missing
        ml_input['occupancy_flag'] = df.get('is_occupied', 1) 

        # Predict
        # Isolation Forest returns -1 for anomalies, 1 for normal
        predictions = model.predict(ml_input)
        
        anomalies = []
        for idx, pred in enumerate(predictions):
            if pred == -1:
                record = records[idx]
                anomalies.append({
                    "timestamp": record.get("timestamp", "Now"),
                    "device_name": record.get("device_name", "Unknown"),
                    "device_type": record.get("device_type", "appliance"),
                    "energy_kwh": record.get("energy_kwh", 0),
                    "threshold_kwh": "AI-Dynamic", # No static threshold in ML
                    "reason": "Abnormal usage pattern detected by AI"
                })
        
        return anomalies

    except Exception as e:
        print(f"Anomaly Detection Error: {e}")
        return []