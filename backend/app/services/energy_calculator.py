from app.services.data_loader import load_energy_data
from app.services.billing_service import calculate_electricity_bill
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
            "raw_records": [],
            "savings_amount": 0,
            "delta_kwh": 0
        }

    # 1. TIME WINDOW FILTERING (Last 30 Days)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.sort_values("timestamp")
    latest_date = df["timestamp"].max()
    
    # Current Period (Last 30 Days)
    start_date = latest_date - timedelta(days=30)
    monthly_df = df[df["timestamp"] >= start_date].copy()
    
    # Previous Period (30 Days before that)
    prev_start = start_date - timedelta(days=30)
    prev_df = df[(df["timestamp"] >= prev_start) & (df["timestamp"] < start_date)].copy()

    # 2. AGGREGATION
    device_energy = (
        monthly_df.groupby("device_name")["energy_kwh"]
        .sum()
        .round(2)
        .to_dict()
    )

    total_energy = float(sum(device_energy.values()))
    active_devices = len(device_energy)
    
    # Previous Total
    prev_total_energy = prev_df["energy_kwh"].sum()

    # 3. UNIFIED BILLING LOGIC (Slab-Based)
    # Calculate bills independently from raw kWh
    current_bill = calculate_electricity_bill(total_energy)["estimated_bill_rupees"]
    prev_bill = calculate_electricity_bill(prev_total_energy)["estimated_bill_rupees"]
    
    # Savings = Previous Bill - Current Bill
    savings_amount = prev_bill - current_bill
    delta_kwh = total_energy - prev_total_energy

    # 4. NIGHT USAGE
    if "is_nighttime" not in monthly_df.columns:
        if "is_night" in monthly_df.columns:
             monthly_df["is_nighttime"] = monthly_df["is_night"]
        else:
            monthly_df["hour"] = monthly_df["timestamp"].dt.hour
            monthly_df["is_nighttime"] = monthly_df["hour"].apply(lambda x: 1 if x >= 22 or x <= 6 else 0)

    night_energy = monthly_df[monthly_df["is_nighttime"] == 1]["energy_kwh"].sum()
    night_percent = round((night_energy / total_energy) * 100, 2) if total_energy > 0 else 0

    return {
        "total_energy_kwh": round(total_energy, 2),
        "active_devices": active_devices,
        "device_wise_energy_kwh": device_energy,
        "night_usage_percent": night_percent,
        "anomaly_count": 0, 
        "raw_records": monthly_df.to_dict(orient="records"),
        # Unified Metrics
        "savings_amount": round(savings_amount, 2),
        "delta_kwh": round(delta_kwh, 2),
        "current_bill": round(current_bill, 2), # Expose for other services
        "prev_bill": round(prev_bill, 2)        # Expose for other services
    }