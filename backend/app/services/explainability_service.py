# backend/app/services/explainability_service.py

from collections import defaultdict

def generate_explanations(calculated_data):
    """
    Generates human-readable AI insights from real energy data.
    Ensures strings are converted to numbers for accurate logic.
    """
    explanations = []
    
    if not calculated_data:
        return ["System is initializing. No data patterns detected yet."]

    try:
        # 1. Calculate Total Energy Safely
        total_energy = sum(float(item.get("energy_kwh", 0)) for item in calculated_data)
        
        if total_energy == 0:
            return ["No energy consumption recorded in the current cycle."]

        # 2. Find Top Consuming Device
        device_totals = defaultdict(float)
        for item in calculated_data:
            name = item.get("device_name", "Unknown Device")
            energy = float(item.get("energy_kwh", 0))
            device_totals[name] += energy
        
        if device_totals:
            top_device = max(device_totals, key=device_totals.get)
            top_share = (device_totals[top_device] / total_energy) * 100
            explanations.append(f"{top_device} contributed approximately {int(top_share)}% of total energy usage.")

        # 3. Detect Night Usage (10 PM to 6 AM)
        night_energy = 0
        for item in calculated_data:
            try:
                # Handle timestamp formats: "2025-12-01 06:00"
                timestamp = str(item.get("timestamp", ""))
                hour = int(timestamp.split(" ")[1].split(":")[0])
                if hour >= 22 or hour <= 6:
                    night_energy += float(item.get("energy_kwh", 0))
            except:
                continue
                
        night_share = (night_energy / total_energy) * 100
        if night_share > 30:
            explanations.append(f"Night-time usage is high ({int(night_share)}%). Consider optimizing AC/Fans.")

        # 4. Efficiency Check
        high_load = [item.get("device_name") for item in calculated_data if float(item.get("power_watts", 0)) > 3000]
        if high_load:
            explanations.append(f"Heavy load detected from {high_load[0]}. Check for efficiency leaks.")
        else:
            explanations.append("All devices are operating within normal power parameters.")

    except Exception as e:
        return [f"AI Engine is analyzing data patterns..."]

    return explanations