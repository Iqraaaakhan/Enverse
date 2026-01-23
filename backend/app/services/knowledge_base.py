import pandas as pd
from app.services.energy_calculator import compute_dashboard_metrics
from app.services.anomaly_detector import detect_anomalies

# UI Alias Mapping
UI_NAME_MAP = {
    "Residential Cooling (AC)": "Air Conditioner",
    "Laundry Appliances": "Washing Machine",
    "Refrigerator": "Refrigerator",
    "Consumer Electronics": "Electronics",
    "Indoor Lighting Load": "Lighting"
}

def get_live_metrics():
    """
    Fetches metrics directly from the shared calculator to ensure 
    Dashboard and Chatbot ALWAYS show the same numbers.
    """
    # 1. Get Base Metrics (Shared Logic)
    metrics = compute_dashboard_metrics()
    
    if metrics["total_energy_kwh"] == 0:
        return None

    # 2. Format Device Breakdown
    device_stats = metrics["device_wise_energy_kwh"]
    formatted_breakdown = {}
    for k, v in device_stats.items():
        ui_name = UI_NAME_MAP.get(k, k)
        formatted_breakdown[ui_name] = v

    # 3. Identify Top/Bottom
    sorted_devices = sorted(formatted_breakdown.items(), key=lambda x: x[1], reverse=True)
    
    if sorted_devices:
        top_device, top_val = sorted_devices[0]
        bottom_device, bottom_val = sorted_devices[-1]
    else:
        top_device, top_val = "Unknown", 0
        bottom_device, bottom_val = "Unknown", 0

    # 4. Anomalies
    anomalies = detect_anomalies()

    return {
        "total_kwh": metrics["total_energy_kwh"],
        "bill": metrics["current_bill"],      # Direct from calculator
        "prev_bill": metrics["prev_bill"],    # Direct from calculator
        "top_device": top_device,
        "top_device_kwh": top_val,
        "bottom_device": bottom_device,
        "bottom_device_kwh": bottom_val,
        "night_ratio": metrics["night_usage_percent"],
        "device_breakdown": formatted_breakdown,
        "savings_amount": metrics["savings_amount"],
        "delta_kwh": metrics["delta_kwh"],
        "anomaly_count": len(anomalies)
    }