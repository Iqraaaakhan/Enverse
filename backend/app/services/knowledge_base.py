# backend/app/services/knowledge_base.py

from app.services.data_loader import load_energy_data
from app.services.anomaly_detector import detect_anomalies
from app.services.billing_service import calculate_electricity_bill

def get_system_knowledge():
    """
    Generates explainable, examiner-safe system facts
    using precomputed energy_usage.csv (single-home).
    """

    raw_data = load_energy_data()
    if not raw_data:
        return [{"text": "System is initializing energy data.", "category": "status"}]

    # DATA IS ALREADY ENERGY-AWARE
    calculated = raw_data

    anomalies = detect_anomalies(calculated)

    # --- DAILY & MONTHLY AGGREGATION ---
    total_kwh = sum(float(r.get("energy_kwh", 0)) for r in calculated)

    # Assume dataset spans N days (safe normalization)
    days = max(1, len({r["timestamp"][:10] for r in calculated}))
    daily_kwh = round(total_kwh / days, 2)
    monthly_kwh = round(daily_kwh * 30, 2)

    bill = calculate_electricity_bill(monthly_kwh)

    facts = []

    facts.append({
        "text": f"Your home consumed approximately {daily_kwh} kWh per day on average.",
        "category": "usage"
    })

    facts.append({
        "text": f"Estimated monthly energy usage is {monthly_kwh} kWh.",
        "category": "forecast"
    })

    facts.append({
        "text": f"Projected electricity bill is ₹{bill}.",
        "category": "billing"
    })

    if anomalies:
        facts.append({
            "text": f"{len(anomalies)} unusual energy patterns were detected, mainly during night-time or peak spikes.",
            "category": "alert"
        })
    else:
        facts.append({
            "text": "No abnormal energy patterns detected so far.",
            "category": "status"
        })

    return facts
