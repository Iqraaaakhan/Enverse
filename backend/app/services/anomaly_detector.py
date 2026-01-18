import joblib
import pandas as pd
from pathlib import Path
from datetime import timedelta
from app.services.data_loader import load_energy_data

# ---------------------------------------------------------
# LOAD TRAINED ISOLATION FOREST MODEL
# ---------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parents[2]
MODEL_PATH = BASE_DIR / "app" / "ml" / "models" / "anomaly_isolation_forest.pkl"

model_pipeline = None

def load_anomaly_model():
    global model_pipeline
    if MODEL_PATH.exists():
        try:
            model_pipeline = joblib.load(MODEL_PATH)
            print(f"✅ Anomaly Model loaded: {MODEL_PATH}")
        except Exception as e:
            print(f"⚠️ Failed to load Anomaly Model: {e}")
    else:
        print("⚠️ Anomaly Model not found. Using fallback logic.")

load_anomaly_model()

def detect_anomalies(records=None):
    """
    Detects anomalies in the LAST 30 DAYS using Isolation Forest.
    """
    # 1. Load Data
    df = load_energy_data()
    if df.empty:
        return []

    # 2. Filter for Last 30 Days (To match Dashboard)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    latest_date = df["timestamp"].max()
    start_date = latest_date - timedelta(days=30)
    monthly_df = df[df["timestamp"] >= start_date].copy()

    anomalies = []

    # 3. Prepare Features (MUST MATCH TRAINING)
    # Ensure columns exist and fill NaNs
    features = ["power_watts", "energy_kwh", "is_nighttime"]
    
    # Map 'is_night' to 'is_nighttime' if needed
    if "is_nighttime" not in monthly_df.columns and "is_night" in monthly_df.columns:
        monthly_df["is_nighttime"] = monthly_df["is_night"]

    X = monthly_df[features].fillna(0)

    # 4. Run Inference
    if model_pipeline:
        try:
            preds = model_pipeline.predict(X)
            monthly_df["anomaly_score"] = preds
            
            # -1 indicates anomaly
            anomaly_rows = monthly_df[monthly_df["anomaly_score"] == -1]

            for _, row in anomaly_rows.iterrows():
                anomalies.append({
                    "timestamp": str(row["timestamp"]),
                    "device_name": row.get("device_name", "Unknown"),
                    "energy_kwh": round(row.get("energy_kwh", 0), 2),
                    "threshold_kwh": "AI-Dynamic",
                    "reason": f"Abnormal Power Spike ({int(row.get('power_watts', 0))}W)"
                })
        except Exception as e:
            print(f"ML Inference Failed: {e}")
            return _rule_based_detection(monthly_df)
    else:
        return _rule_based_detection(monthly_df)

    return anomalies

def _rule_based_detection(df):
    """
    Fallback logic: Catches massive power spikes (>4000W) 
    or high energy (>4.5 kWh)
    """
    anomalies = []
    for _, row in df.iterrows():
        power = row.get("power_watts", 0)
        energy = row.get("energy_kwh", 0)
        
        # Updated Rules based on your CSV data
        if power > 4000: # Catch the 200kW spikes
            anomalies.append({
                "timestamp": str(row["timestamp"]),
                "device_name": row.get("device_name", "Unknown"),
                "energy_kwh": round(energy, 2),
                "threshold_kwh": "4000W Limit",
                "reason": f"Critical Load Surge ({int(power)}W)"
            })
        elif energy > 4.5: # Catch the 4.9 kWh spikes
            anomalies.append({
                "timestamp": str(row["timestamp"]),
                "device_name": row.get("device_name", "Unknown"),
                "energy_kwh": round(energy, 2),
                "threshold_kwh": "4.5 kWh",
                "reason": "High Energy Consumption"
            })
            
    return anomalies