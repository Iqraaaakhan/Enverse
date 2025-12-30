# backend/app/services/nilm_explainer.py

import pandas as pd
import joblib
from pathlib import Path

# --------------------------------------------------
# Paths
# --------------------------------------------------
PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = PROJECT_ROOT / "data"
MODEL_DIR = PROJECT_ROOT / "app" / "ml" / "models"

DATA_FILE = DATA_DIR / "appliance_energy_log.csv"
MODEL_FILE = MODEL_DIR / "nilm_xgboost_model.pkl"


def explain_energy_usage():
    """
    Generates explainable insights using NILM ML predictions.
    Returns appliance contribution, night usage, and idle usage insights.
    """

    # Load data
    df = pd.read_csv(DATA_FILE)

    # Load trained NILM model
    model = joblib.load(MODEL_FILE)

    # Encode appliance (same logic as training)
    df["appliance_code"] = df["appliance"].astype("category").cat.codes

    # Features for prediction
    X = df[
        [
            "power_watts",
            "duration_minutes",
            "is_night",
            "is_idle",
            "appliance_code",
        ]
    ]

    # Predict energy (NumPy output)
    df["predicted_energy_kwh"] = model.predict(X)

    # -------------------------------
    # Appliance contribution
    # -------------------------------
    appliance_energy = (
        df.groupby("appliance")["predicted_energy_kwh"].sum()
    )

    total_energy = float(appliance_energy.sum())

    appliance_percent = (
        (appliance_energy / total_energy) * 100
    ).round(1)

    top_appliance = str(appliance_percent.idxmax())
    top_percent = float(appliance_percent.max())

    # -------------------------------
    # Night vs day usage
    # -------------------------------
    night_energy = float(
        df[df["is_night"] == 1]["predicted_energy_kwh"].sum()
    )
    day_energy = float(
        df[df["is_night"] == 0]["predicted_energy_kwh"].sum()
    )

    night_increase = float(
        ((night_energy - day_energy) / max(day_energy, 0.001)) * 100
    )

    # -------------------------------
    # Idle usage detection
    # -------------------------------
    idle_appliances = (
        df[df["is_idle"] == 1]["appliance"]
        .astype(str)
        .unique()
        .tolist()
    )

    # -------------------------------
    # Explanation output (JSON SAFE)
    # -------------------------------
    explanations = [
        f"{top_appliance} contributed approximately {int(top_percent)}% of total energy usage",
        f"Night-time usage increased by nearly {abs(int(night_increase))}% compared to daytime",
    ]

    if idle_appliances:
        explanations.append(
            f"Idle appliance usage detected ({', '.join(idle_appliances)})"
        )

    return {
        "total_energy_kwh": round(total_energy, 2),
        "top_appliance": top_appliance,
        "appliance_breakdown_percent": {
            k: float(v) for k, v in appliance_percent.to_dict().items()
        },
        "explanations": explanations,
    }
