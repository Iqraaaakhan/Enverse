from app.services.data_loader import load_energy_data
import pandas as pd
from datetime import timedelta

def compute_dashboard_metrics():
    df = load_energy_data()

    if df.empty:
        return {
            "total_energy_kwh": 0,
            "active_devices": 0,
            "device_wise_energy_kwh": {},
            "night_usage_percent": 0,
            "raw_records": []
        }

    # ---------------------------------------------------------
    # 1. REAL TIME-WINDOW FILTERING (Last 30 Days)
    # ---------------------------------------------------------
    # Convert timestamp to datetime objects
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    
    # Sort to ensure we find the true 'latest' point
    df = df.sort_values("timestamp")

    # Determine the simulation "Current Date" (Max date in dataset)
    latest_date = df["timestamp"].max()
    
    # Calculate start of the billing cycle (30 days ago)
    start_date = latest_date - timedelta(days=30)
    
    # Filter: Only keep rows within this window
    monthly_df = df[df["timestamp"] >= start_date].copy()

    # ---------------------------------------------------------
    # 2. AGGREGATION (Summing the filtered window)
    # ---------------------------------------------------------
    device_energy = (
        monthly_df.groupby("device_name")["energy_kwh"]
        .sum()
        .round(2)
        .to_dict()
    )

    total_energy = float(sum(device_energy.values()))
    active_devices = len(device_energy)

    # ---------------------------------------------------------
    # 3. NIGHT USAGE ANALYSIS
    # ---------------------------------------------------------
    # Ensure 'is_night' exists
    if "is_night" not in monthly_df.columns:
        monthly_df["hour"] = monthly_df["timestamp"].dt.hour
        monthly_df["is_night"] = monthly_df["hour"].apply(lambda x: 1 if x >= 22 or x <= 6 else 0)

    night_energy = monthly_df[monthly_df["is_night"] == 1]["energy_kwh"].sum()
    
    # Avoid division by zero
    night_percent = round((night_energy / total_energy) * 100, 2) if total_energy > 0 else 0

    return {
        "total_energy_kwh": round(total_energy, 2),
        "active_devices": active_devices,
        "device_wise_energy_kwh": device_energy,
        "night_usage_percent": night_percent,
        "anomaly_count": 0, # Populated by main.py
        "raw_records": monthly_df.to_dict(orient="records")
    }