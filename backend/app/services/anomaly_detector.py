from app.services.data_loader import load_energy_data

def detect_anomalies(records=None):
    """
    Detects anomalous energy usage patterns.
    SAFE DEFAULT: if records not passed, load from CSV.
    """

    if records is None:
        records = load_energy_data().to_dict(orient="records")

    anomalies = []

    for row in records:
        energy = row.get("energy_kwh", 0)
        device = row.get("device_name", "Unknown")

        # Simple, explainable anomaly rule (exam-safe)
        if energy > 5.0:  # unusually high per record
            anomalies.append({
                "device": device,
                "energy_kwh": round(energy, 2),
                "reason": "Unusually high consumption spike"
            })

    return anomalies
