import pandas as pd
import joblib
from pathlib import Path
import sys
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error

# ---------------------------------------------------------
# 1. ROBUST PATH SETUP
# ---------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR.parents[1] / "data" / "nilm_training_data.csv"
MODEL_DIR = BASE_DIR / "models"
MODEL_PATH = MODEL_DIR / "nilm_xgboost_model.pkl"

# Ensure model directory exists
MODEL_DIR.mkdir(parents=True, exist_ok=True)

print(f"📍 Script Location: {BASE_DIR}")
print(f"📂 Looking for Data at: {DATA_PATH}")

if not DATA_PATH.exists():
    print(f"❌ ERROR: Data file not found at {DATA_PATH}")
    print("   Please run: python -m app.services.kaggle_importer")
    sys.exit(1)

# ---------------------------------------------------------
# 2. TRAIN REAL NILM MODEL (XGBoost)
# ---------------------------------------------------------
def train_nilm_model():
    print("TASKS: Loading NILM dataset...")
    df = pd.read_csv(DATA_PATH)

    # Features: Power, Duration, Context
    X = df[[
        "power_watts",
        "duration_minutes",
        "is_night",
        "is_occupied",
        "appliance_code"
    ]]
    
    # Target: Energy Consumption (kWh)
    y = df["energy_kwh"]

    print("TASKS: Splitting data...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42
    )

    print("TASKS: Training XGBoost Regressor (Real AI)...")
    # XGBoost is industry standard for this type of tabular regression
    model = XGBRegressor(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.08,
        n_jobs=-1, # Use all cores
        random_state=42
    )

    model.fit(X_train, y_train)

    # Evaluate
    preds = model.predict(X_test)
    mae = mean_absolute_error(y_test, preds)

    # Save
    joblib.dump(model, MODEL_PATH)

    print(f"✅ SUCCESS: NILM Model trained!")
    print(f"   MAE: {mae:.4f}")
    print(f"   Saved to: {MODEL_PATH}")

if __name__ == "__main__":
    train_nilm_model()