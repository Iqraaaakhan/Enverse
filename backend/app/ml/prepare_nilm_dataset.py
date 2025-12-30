# backend/app/ml/prepare_nilm_dataset.py

import pandas as pd
from pathlib import Path

# Paths
# Paths
PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = PROJECT_ROOT / "data"

INPUT_FILE = DATA_DIR / "appliance_energy_log.csv"
OUTPUT_FILE = DATA_DIR / "nilm_training_data.csv"

# Ensure output directory exists (industry standard)
DATA_DIR.mkdir(parents=True, exist_ok=True)

def prepare_nilm_data():
    """
    Prepares appliance-level NILM regression dataset.
    This is used for training ML models (XGBoost).
    """

    df = pd.read_csv(INPUT_FILE)

    # Encode appliance names
    df["appliance_code"] = df["appliance"].astype("category").cat.codes

    # Feature set
    features = df[
        [
            "appliance_code",
            "power_watts",
            "duration_minutes",
            "is_night",
            "is_idle",
        ]
    ]

    # Target
    target = df["energy_kwh"]

    training_df = features.copy()
    training_df["energy_kwh"] = target

    training_df.to_csv(OUTPUT_FILE, index=False)

    print("NILM training dataset prepared successfully")
    print(f"Saved at: {OUTPUT_FILE}")

if __name__ == "__main__":
    prepare_nilm_data()
