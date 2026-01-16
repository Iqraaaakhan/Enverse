# backend/app/services/data_processor.py

import pandas as pd
import sys
from pathlib import Path

# -------------------------------------------------
# PURPOSE:
# One-time ETL from Kaggle Smart Energy Advisor
# → curated energy_usage.csv (single home)
# -------------------------------------------------

OUTPUT_PATH = Path(__file__).resolve().parents[2] / "data" / "energy_usage.csv"

# -----------------------------
# Safety helpers
# -----------------------------
def sanitize_wattage(watts):
    try:
        w = float(watts)
        if w < 0:
            return 0.0
        if w > 5000:              # physical cap (home appliances)
            return 3500.0
        return w
    except:
        return 0.0

# -----------------------------
# MAIN PROCESSOR
# -----------------------------
def process_kaggle_data(input_csv: str):
    df = pd.read_csv(input_csv)

    REQUIRED = {
        "timestamp",
        "appliance",
        "power_watts",
        "season",
        "is_daytime",
        "is_nighttime"
    }

    missing = REQUIRED - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    # ---- Timestamp ----
    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
    df = df.dropna(subset=["timestamp"])

    # ---- Device naming ----
    df["device_name"] = df["appliance"].str.strip()
    df["device_type"] = df["appliance"].str.strip()

    # ---- Power ----
    df["power_watts"] = df["power_watts"].apply(sanitize_wattage)

    # ---- Duration (fixed window, realistic) ----
    df["duration_minutes"] = 60

    # ---- Energy (REAL physics) ----
    df["energy_kwh"] = (df["power_watts"] * df["duration_minutes"]) / (1000 * 60)

    # ---- Baseline injection (exam-safe realism) ----
    baseline_devices = ["Refrigerator", "WiFi Router"]
    df.loc[df["device_name"].isin(baseline_devices), "energy_kwh"] = \
        df.loc[df["device_name"].isin(baseline_devices), "energy_kwh"].clip(lower=0.04)

    # ---- Final curated dataset ----
    final_df = df[
        [
            "timestamp",
            "device_name",
            "device_type",
            "power_watts",
            "duration_minutes",
            "energy_kwh",
            "season",
            "is_daytime",
            "is_nighttime",
        ]
    ]

    # Keep last ~2500 rows (single home, clean, explainable)
    final_df = final_df.tail(2500)

    OUTPUT_PATH.parent.mkdir(exist_ok=True)
    final_df.to_csv(OUTPUT_PATH, index=False)

    print(f"✅ energy_usage.csv written → {OUTPUT_PATH}")
    print(f"📊 Rows: {len(final_df)}")


# -----------------------------
# CLI
# -----------------------------
if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise RuntimeError("Usage: python data_processor.py <smart_energy_advisor.csv>")
    process_kaggle_data(sys.argv[1])
