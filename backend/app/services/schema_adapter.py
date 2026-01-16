# backend/app/services/schema_adapter.py

import pandas as pd

REQUIRED_COLUMNS = [
    "timestamp",
    "home_id",
    "energy_consumption_kwh",
    "temperature_setting_C",
    "occupancy_status",
    "appliance",
    "usage_duration_minutes",
    "season",
    "day_of_week",
    "hour",
    "is_night"
]

def load_canonical_energy_data(csv_path: str) -> pd.DataFrame:
    """
    Canonical loader for Smart Energy Advisor dataset.
    Guarantees schema expected by existing services.
    """

    df = pd.read_csv(csv_path)

    # ---- Basic sanity ----
    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
    df["hour"] = df["timestamp"].dt.hour

    # ---- Normalize occupancy ----
    df["occupancy_status"] = df["occupancy_status"].map({
        "Occupied": 1,
        "Unoccupied": 0
    }).fillna(0)

    # ---- Night flag (REAL logic) ----
    df["is_night"] = df["hour"].apply(lambda h: 1 if (h >= 22 or h <= 5) else 0)

    # ---- Rename for backward compatibility ----
    df.rename(columns={
        "temperature_setting_C": "temperature_setting",
        "usage_duration_minutes": "duration_minutes"
    }, inplace=True)

    # ---- Energy sanity ----
    df["energy_consumption_kwh"] = pd.to_numeric(
        df["energy_consumption_kwh"], errors="coerce"
    ).fillna(0)

    # ---- Final schema ----
    df = df[[
        "timestamp",
        "home_id",
        "appliance",
        "energy_consumption_kwh",
        "duration_minutes",
        "temperature_setting",
        "occupancy_status",
        "season",
        "day_of_week",
        "hour",
        "is_night"
    ]]

    return df
