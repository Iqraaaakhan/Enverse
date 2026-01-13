from app.services.data_loader import load_energy_data
from app.services.energy_calculator import calculate_energy_kwh
from app.services.anomaly_detector import detect_anomalies
from app.services.billing_service import calculate_electricity_bill

def get_system_knowledge():
    """
    Dynamically generates a list of facts from real system data.
    Ensures the NLP engine always has the latest context.
    """
    raw_data = load_energy_data()
    calculated = calculate_energy_kwh(raw_data)
    anomalies = detect_anomalies(calculated)
    
    # Calculate total units and bill dynamically
    total_kwh = sum(float(item.get("energy_kwh", 0)) for item in calculated)
    bill_data = calculate_electricity_bill(total_kwh)
    
    facts = []
    
    # 1. Dynamic Billing Fact
    facts.append({
        "text": f"Your current monthly consumption is {bill_data['monthly_units_kwh']} kWh. The estimated bill is {bill_data['estimated_bill_rupees']} {bill_data['currency']}.",
        "category": "billing"
    })
    
    # 2. Dynamic Security Fact
    if anomalies:
        facts.append({
            "text": f"Security Alert: I have detected {len(anomalies)} anomalies. Devices like {anomalies[0]['device_name']} are exceeding safe energy thresholds.",
            "category": "security"
        })
    else:
        facts.append({
            "text": "All systems are nominal. No energy anomalies or security risks detected in the current cycle.",
            "category": "security"
        })
    
    # 3. Dynamic Device Facts (Top 5 consumers)
    sorted_devices = sorted(calculated, key=lambda x: x['energy_kwh'], reverse=True)
    for item in sorted_devices[:5]:
        facts.append({
            "text": f"The {item['device_name']} is drawing {item['power_watts']}W and has used {item['energy_kwh']} kWh so far.",
            "category": "device"
        })
        
    return facts