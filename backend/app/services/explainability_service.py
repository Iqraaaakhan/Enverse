# backend/app/services/explainability_service.py

from collections import defaultdict

def generate_explanations(calculated_data):
    """
    Generates human-readable explanations
    for high energy consumption.
    """

    explanations = []

    total_energy = sum(item["energy_kwh"] for item in calculated_data)
    if total_energy == 0:
        return explanations

    # -----------------------------
    # 1. Appliance contribution
    # -----------------------------
    device_energy = defaultdict(float)
    for item in calculated_data:
        device_energy[item["device_name"]] += item["energy_kwh"]

    top_device = max(device_energy, key=device_energy.get)
    top_percent = (device_energy[top_device] / total_energy) * 100

    if top_percent > 50:
        explanations.append(
            f"{top_device} contributed {top_percent:.0f}% of total energy usage."
        )

    # -----------------------------
    # 2. Night usage pattern
    # -----------------------------
    night_energy = sum(
        item["energy_kwh"]
        for item in calculated_data
        if 0 <= item.get("hour", 0) <= 6
    )

    night_percent = (night_energy / total_energy) * 100

    if night_percent > 30:
        explanations.append(
            f"Night-time energy usage increased by {night_percent:.0f}%."
        )

    # -----------------------------
    # 3. Idle device detection
    # -----------------------------
    idle_devices = [
        item["device_name"]
        for item in calculated_data
        if item["power_watts"] < 10 and item["duration_minutes"] > 60
    ]

    if idle_devices:
        explanations.append(
            f"{idle_devices[0]} was running during idle hours."
        )

    return explanations
