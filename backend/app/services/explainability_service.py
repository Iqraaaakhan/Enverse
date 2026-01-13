# backend/app/services/explainability_service.py

from collections import defaultdict

def generate_explanations(calculated_data):
    """
    Generates human-readable AI insights from real energy data.
    """
    explanations = []
    
    if not calculated_data:
        return ["System is initializing. No data patterns detected yet."]

    # 1. Calculate Total Energy
    total_energy = sum(item["energy_kwh"] for item in calculated_data)
    
    # 2. Find Top Consuming Device
    device_totals = defaultdict(float)
    for item in calculated_data:
        device_totals[item["device_name"]] += item["energy_kwh"]
    
    if device_totals:
        top_device = max(device_totals, key=device_totals.get)
        top_share = (device_totals[top_device] / total_energy) * 100
        explanations.append(f"{top_device} contributed approximately {int(top_share)}% of total energy usage.")

    # 3. Detect Night Usage (Realism: 10 PM to 6 AM)
    night_energy = 0
    for item in calculated_data:
        # Extract hour from timestamp string "2025-12-01 06:00"
        try:
            hour = int(item["timestamp"].split(" ")[1].split(":")[0])
            if hour >= 22 or hour <= 6:
                night_energy += item["energy_kwh"]
        except:
            continue
            
    if total_energy > 0:
        night_share = (night_energy / total_energy) * 100
        if night_share > 30:
            explanations.append(f"Night-time usage is high ({int(night_share)}%). Consider optimizing AC/Fans.")

    # 4. Anomaly Check
    high_power_devices = [item["device_name"] for item in calculated_data if item["power_watts"] > 3000]
    if high_power_devices:
        explanations.append(f"Heavy load detected from {high_power_devices[0]}. Check for efficiency leaks.")
    else:
        explanations.append("All devices are operating within normal power parameters.")

    return explanations