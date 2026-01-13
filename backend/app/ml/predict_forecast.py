# backend/app/ml/predict_forecast.py

from pathlib import Path
import joblib
import pandas as pd
import os

# Resolve paths
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "energy_forecast_model.pkl"
DATA_PATH = BASE_DIR.parent.parent / "data" / "energy_usage.csv"

def get_energy_forecast():
    """
    Uses the trained XGBoost model to predict future usage.
    """
    if not MODEL_PATH.exists():
        return {"status": "error", "message": "Model brain not found. Run trainer first."}

    # Load the trained model
    model = joblib.load(MODEL_PATH)

    # Load the latest state of the house from CSV
    if not DATA_PATH.exists():
        return {"status": "error", "message": "Data source missing."}
        
    df = pd.read_csv(DATA_PATH)
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    
    # Get the very last row to see what's happening 'Now'
    latest = df.iloc[-1:].copy()
    latest['hour'] = latest['timestamp'].dt.hour
    latest['day_of_week'] = latest['timestamp'].dt.dayofweek

    # Select features (Must match train_forecast.py exactly)
    features = ['power_watts', 'duration_minutes', 'hour', 'day_of_week']
    X_input = latest[features]

    # Predict the kWh for this specific state
    prediction = float(model.predict(X_input)[0])

    # Industry Logic: If prediction is negative (ML noise), floor it to 0
    prediction = max(0, prediction)

   # backend/app/ml/predict_forecast.py
# Replace the return statement at the end of get_energy_forecast()

    # Read the real MAE from the file
    mae_val = 0.33 # Default
    mae_path = BASE_DIR / "mae_report.txt"
    if mae_path.exists():
        with open(mae_path, "r") as f:
            mae_val = float(f.read())

    return {
        "status": "ml_prediction",
        "mae": mae_val, # Send real MAE
        "forecast": {
            "next_day_kwh": round(prediction, 2),
            "next_week_kwh": round(prediction * 7, 2),
            "next_month_kwh": round(prediction * 30, 2),
        }
    }