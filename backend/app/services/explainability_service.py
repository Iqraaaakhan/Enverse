# backend/app/services/explainability_service.py

from collections import defaultdict

def generate_explanations(calculated_data):
    """
    Generates human-readable explanations for high energy consumption.
    """
    explanations = []

    # 1. Calculate total energy safely
    try:
        total_energy = sum(float(item.get("energy_kwh", 0)) for item in calculated_data)
    except (ValueError, TypeError):
        total_energy = 0
    
    if total_energy == 0:
        return explanations

    # -----------------------------
    # 1. Appliance contribution
    # -----------------------------
    device_energy = defaultdict(float)
    for item in calculated_data:
        try:
            energy = float(item.get("energy_kwh", 0))
            device_energy[item["device_name"]] += energy
        except (ValueError, TypeError):
            continue

    if device_energy:
        top_device = max(device_energy, key=device_energy.get)
        top_percent = (device_energy[top_device] / total_energy) * 100

        if top_percent > 50:
            explanations.append(
                f"{top_device} contributed {top_percent:.0f}% of total energy usage."
            )

    # -----------------------------
    # 2. Night usage pattern
    # -----------------------------
    night_energy = 0
    for item in calculated_data:
        try:
            # Safely handle hour and energy conversion
            # We use .get("timestamp") or similar if "hour" isn't directly in the dict
            # But based on your logic, we assume hour is available or defaults to 0
            hour = int(item.get("hour", 0))
            if 0 <= hour <= 6:
                night_energy += float(item.get("energy_kwh", 0))
        except (ValueError, TypeError):
            continue

    night_percent = (night_energy / total_energy) * 100

    if night_percent > 30:
        explanations.append(
            f"Night-time energy usage increased by {night_percent:.0f}%."
        )

    # -----------------------------
    # 3. Idle device detection
    # -----------------------------
    idle_devices = []
    for item in calculated_data:
        try:
            power = float(item.get("power_watts", 0))
            duration = float(item.get("duration_minutes", 0))
            
            if power < 10 and duration > 60:
                idle_devices.append(item["device_name"])
        except (ValueError, TypeError):
            continue

    if idle_devices:
        explanations.append(
            f"{idle_devices[0]} was running during idle hours."
        )

    return explanations