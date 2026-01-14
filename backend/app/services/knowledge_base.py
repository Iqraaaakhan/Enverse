# backend/app/services/knowledge_base.py

from app.services.data_loader import load_energy_data
from app.services.energy_calculator import calculate_energy_kwh
from app.services.anomaly_detector import detect_anomalies
from app.services.billing_service import calculate_electricity_bill

def get_system_knowledge():
    """
    Dynamically generates facts from real Kaggle-processed data.
    Normalized for Monthly context to match the Dashboard.
    """
    raw_data = load_energy_data()
    calculated = calculate_energy_kwh(raw_data)
    anomalies = detect_anomalies(calculated)
    
    if not calculated:
        return [{"text": "System is initializing data streams.", "category": "status"}]

    # 1. Calculate Normalized Monthly Total
    total_raw_kwh = sum(float(item.get("energy_kwh", 0)) for item in calculated)
    estimated_days = len(calculated) / 24 if len(calculated) > 0 else 1
    monthly_kwh = (total_raw_kwh / estimated_days) * 30
    
    bill_data = calculate_electricity_bill(monthly_kwh)
    
    facts = []
    
    # 2. Dynamic Billing Fact
    facts.append({
        "text": f"Your estimated monthly consumption is {round(monthly_kwh, 2)} kWh. Based on current patterns, your projected bill is {bill_data['estimated_bill_rupees']} INR.",
        "category": "billing"
    })
    
    # 3. Security Fact
    if anomalies:
        facts.append({
            "text": f"Security Alert: I have detected {len(anomalies)} energy anomalies. Some devices are exceeding safety thresholds defined in the system.",
            "category": "security"
        })
    else:
        facts.append({
            "text": "All energy nodes are operating within safe parameters. No anomalies detected.",
            "category": "security"
        })
    
    # 4. Top Device Fact (Normalized)
    device_totals = {}
    for item in calculated:
        name = item['device_name']
        device_totals[name] = device_totals.get(name, 0) + (float(item['energy_kwh']) / estimated_days * 30)
    
    top_device = max(device_totals, key=device_totals.get)
    facts.append({
        "text": f"The {top_device} is your highest consumer, estimated at {round(device_totals[top_device], 2)} kWh per month.",
        "category": "device"
    })
        
    return facts