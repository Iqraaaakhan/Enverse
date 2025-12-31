from typing import List, Dict


# Simple threshold rules (can be learned later by ML)
# Tuned for Realistic Household Consumption
DEVICE_ENERGY_THRESHOLDS = {
    "ac": 8.0,              # AC is 10kWh (Caught)
    "fan": 0.8,
    "light": 0.5,
    "appliance": 2.2,       # Washing machine is 2.4kWh (Caught)
    "kitchen": 1.2,         # Kettle is 1.35kWh (Caught)
    "entertainment": 1.5,
    "bathroom": 4.0,        # Geyser is 4.5kWh (Caught)
}
def detect_anomalies(records: List[Dict]) -> List[Dict]:
    """
    Detects anomalous energy usage based on device-specific thresholds.
    """
    anomalies = []

    for row in records:
        device_type = row["device_type"]
        energy_kwh = row["energy_kwh"]

        threshold = DEVICE_ENERGY_THRESHOLDS.get(device_type, 1.0)

        if energy_kwh > threshold:
            anomalies.append({
                "timestamp": row["timestamp"],
                "device_name": row["device_name"],
                "device_type": device_type,
                "energy_kwh": energy_kwh,
                "threshold_kwh": threshold,
                "reason": "Energy usage exceeded normal threshold"
            })

    return anomalies
