from app.services.data_loader import load_energy_data

def compute_dashboard_metrics():
    df = load_energy_data()

    if df.empty:
        return {
            "total_energy_kwh": 0,
            "active_devices": 0,
            "device_wise_energy_kwh": {},
            "night_usage_percent": 0
        }

    # DEVICE-WISE AGGREGATION (THIS FEEDS YOUR CHARTS)
    device_energy = (
        df.groupby("device_name")["energy_kwh"]
        .sum()
        .round(3)
        .to_dict()
    )

    total_energy = float(sum(device_energy.values()))
    active_devices = len(device_energy)

    night_energy = df[df["is_night"] == 1]["energy_kwh"].sum()
    night_percent = round((night_energy / total_energy) * 100, 2) if total_energy > 0 else 0

    return {
        "total_energy_kwh": round(total_energy, 2),
        "active_devices": active_devices,
        "device_wise_energy_kwh": device_energy,
        "night_usage_percent": night_percent
    }
