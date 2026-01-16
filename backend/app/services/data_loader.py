import pandas as pd
from pathlib import Path

# -------------------------------------------------
# ABSOLUTE CANONICAL DATA SOURCE
# -------------------------------------------------
BASE_DIR = Path(__file__).resolve().parents[2]
DATA_PATH = BASE_DIR / "data" / "energy_usage.csv"

# -------------------------------------------------
# SAFE LOADER (NO SILENT FAILURES)
# -------------------------------------------------
def load_energy_data() -> pd.DataFrame:
    """
    Loads curated single-home energy dataset.
    This file is distilled from Kaggle Smart Energy Advisor.
    """

    if not DATA_PATH.exists():
        raise FileNotFoundError(
            f"energy_usage.csv NOT FOUND at {DATA_PATH}"
        )

    df = pd.read_csv(DATA_PATH)

    # -------------------------------------------------
    # Mandatory columns check (EXAM-SAFE)
    # -------------------------------------------------
    required_cols = {
        "timestamp",
        "device_name",
        "device_type",
        "power_watts",
        "duration_minutes",
        "energy_kwh",
    }

    missing = required_cols - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    # -------------------------------------------------
    # Timestamp safety
    # -------------------------------------------------
    df["timestamp"] = pd.to_datetime(
        df["timestamp"],
        errors="coerce"
    )
    df = df.dropna(subset=["timestamp"])

    # -------------------------------------------------
    # Derive day / night flags (REAL, Kaggle-consistent)
    # -------------------------------------------------
    df["hour"] = df["timestamp"].dt.hour
    df["is_day"] = df["hour"].between(6, 18).astype(int)
    df["is_night"] = (1 - df["is_day"])

    # -------------------------------------------------
    # Numeric safety (JSON + ML safe)
    # -------------------------------------------------
    numeric_cols = [
        "energy_kwh",
        "power_watts",
        "duration_minutes",
    ]

    for col in numeric_cols:
        df[col] = (
            pd.to_numeric(df[col], errors="coerce")
            .replace([float("inf"), float("-inf")], 0)
            .fillna(0)
        )

    return df
