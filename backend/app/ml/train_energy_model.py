import pandas as pd
import joblib
from pathlib import Path
import sys

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error

# ---------------------------------------------------------
# 1. ROBUST PATH SETUP (NO HARDCODING)
# ---------------------------------------------------------

# Directory of this script → backend/app/ml
BASE_DIR = Path(__file__).resolve().parent

# Navigate to backend/data/energy_usage.csv
DATA_PATH = Path(__file__).resolve().parents[2] / "data" / "energy_usage.csv"

# Model output directory
MODEL_DIR = BASE_DIR / "models"
MODEL_PATH = MODEL_DIR / "energy_estimation_model.pkl"

# Ensure model directory exists
MODEL_DIR.mkdir(parents=True, exist_ok=True)

print(f"📍 Script Location: {BASE_DIR}")
print(f"📂 Looking for Data at: {DATA_PATH}")

if not DATA_PATH.exists():
    print(f"❌ ERROR: Data file not found at {DATA_PATH}")
    print("   Required: backend/data/energy_usage.csv")
    sys.exit(1)

# ---------------------------------------------------------
# 2. LOAD, TRAIN & SAVE (REAL ML PIPELINE)
# ---------------------------------------------------------

def train_energy_model():
    print("TASKS: Loading dataset...")
    df = pd.read_csv(DATA_PATH)

    # -------------------------------------------------
    # Feature selection (MATCHES data_processor.py)
    # -------------------------------------------------
    FEATURES = [
        "power_watts",
        "duration_minutes",
        "is_daytime",
        "is_nighttime"
    ]

    TARGET = "energy_kwh"

    # Safety check (exam-proof)
    missing = [c for c in FEATURES + [TARGET] if c not in df.columns]
    if missing:
        print(f"❌ ERROR: Missing required columns: {missing}")
        sys.exit(1)

    X = df[FEATURES]
    y = df[TARGET]

    print("TASKS: Splitting data...")
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42
    )

    print("TASKS: Training Random Forest Model (Real AI)...")

    model = RandomForestRegressor(
        n_estimators=200,
        max_depth=12,
        random_state=42,
        n_jobs=-1
    )

    model.fit(X_train, y_train)

    print("TASKS: Evaluating model...")
    preds = model.predict(X_test)
    mae = mean_absolute_error(y_test, preds)

    joblib.dump(model, MODEL_PATH)

    print("✅ SUCCESS: Energy Estimation Model Trained")
    print(f"   MAE: {mae:.4f} kWh")
    print(f"   Model saved at: {MODEL_PATH}")

# ---------------------------------------------------------
# ENTRY POINT
# ---------------------------------------------------------

if __name__ == "__main__":
    train_energy_model()
