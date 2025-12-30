from typing import List, Dict


# Simple threshold rules (can be learned later by ML)
DEVICE_ENERGY_THRESHOLDS = {
    "ac": 3.0,              # kWh per usage
    "fan": 0.3,
    "light": 0.2,
    "appliance": 1.0,
    "kitchen": 1.5,
    "entertainment": 0.5,
    "bathroom": 1.0,
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
