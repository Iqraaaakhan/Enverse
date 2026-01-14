# backend/ml/preprocess_energy_data.py

import pandas as pd

INPUT_PATH = "../../data/smart_home_energy_usage_dataset.csv"
OUTPUT_PATH = "../../data/processed_energy_data.csv"


# Load raw data
df = pd.read_csv(INPUT_PATH)

# Basic cleaning
df = df.dropna()

# Convert timestamp
df["timestamp"] = pd.to_datetime(df["timestamp"])

# Encode occupancy
df["occupancy_flag"] = df["occupancy_status"].map(
    {"Occupied": 1, "Unoccupied": 0}
)

# Keep only useful columns for ML
processed_df = df[
    [
        "timestamp",
        "appliance",
        "usage_duration_minutes",
        "temperature_setting_C",
        "occupancy_flag",
        "season",
        "day_of_week",
        "holiday",
        "energy_consumption_kWh",
    ]
]

# Save processed data
processed_df.to_csv(OUTPUT_PATH, index=False)

print("Processed energy dataset saved successfully.")
