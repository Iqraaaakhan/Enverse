import pandas as pd
import joblib
from pathlib import Path
import os

# --------------------------------------------------
# ROBUST PATH SETUP
# --------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parents[1]
DATA_FILE = PROJECT_ROOT / "data" / "appliance_energy_log.csv"
MODEL_FILE = PROJECT_ROOT / "app" / "ml" / "models" / "nilm_xgboost_model.pkl"

def explain_energy_usage():
    """
    Generates explainable insights using NILM ML predictions.
    """
    if not DATA_FILE.exists():
        return {"error": "Data file not found. Run data processor."}
    
    if not MODEL_FILE.exists():
        return {"error": "NILM Model not trained. Run train_nilm_model.py."}

    try:
        # Load data
        df = pd.read_csv(DATA_FILE)

        # Load trained NILM model
        model = joblib.load(MODEL_FILE)

        # Encode appliance
        df["appliance_code"] = df["appliance"].astype("category").cat.codes

        # Ensure columns exist
        if "is_occupied" not in df.columns:
            df["is_occupied"] = df["is_idle"].apply(lambda x: 0 if x == 1 else 1)

        # Features for prediction
        X = df[[
            "power_watts",
            "duration_minutes",
            "is_night",
            "is_occupied",
            "appliance_code",
        ]]

        # ---------------------------------------------------------
        # REAL AI INFERENCE: Predict energy using XGBoost
        # ---------------------------------------------------------
        df["predicted_energy_kwh"] = model.predict(X)

        # 1. Appliance Breakdown (Predicted)
        appliance_energy = df.groupby("appliance")["predicted_energy_kwh"].sum()
        total_energy = float(appliance_energy.sum())

        if total_energy == 0:
            return {"status": "No energy usage detected"}

        # Convert to dictionary for Dashboard
        device_breakdown = {k: round(float(v), 3) for k, v in appliance_energy.to_dict().items()}

        # 2. Night vs Day Analysis
        night_energy = float(df[df["is_night"] == 1]["predicted_energy_kwh"].sum())
        day_energy = float(df[df["is_night"] == 0]["predicted_energy_kwh"].sum())
        
        night_increase = 0
        if day_energy > 0:
            night_increase = float(((night_energy - day_energy) / day_energy) * 100)

        # 3. Generate Natural Language Explanations
        top_appliance = max(device_breakdown, key=device_breakdown.get)
        top_percent = (device_breakdown[top_appliance] / total_energy) * 100

        explanations = [
            f"AI Analysis: {top_appliance} is the dominant consumer ({int(top_percent)}% of total).",
        ]

        if night_increase > 15:
            explanations.append(f"Alert: Night-time consumption is {int(night_increase)}% higher than day-time.")
        elif night_energy > day_energy:
            explanations.append("Notice: Night-time usage is slightly higher than day-time.")

        return {
            "total_energy_kwh": round(total_energy, 2),
            "device_wise_energy_kwh": device_breakdown, # Used by Dashboard Charts
            "explanations": explanations,
        }
        
    except Exception as e:
        print(f"NILM Explanation Error: {e}")
        return {"error": str(e)}