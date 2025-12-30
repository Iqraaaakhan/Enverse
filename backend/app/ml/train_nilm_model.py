# backend/app/ml/train_nilm_model.py

import pandas as pd
import joblib
from pathlib import Path
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error

# --------------------------------------------------
# Paths (industry-safe, no hardcoding)
# --------------------------------------------------
PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = PROJECT_ROOT / "data"
MODEL_DIR = PROJECT_ROOT / "app" / "ml" / "models"

INPUT_FILE = DATA_DIR / "nilm_training_data.csv"
MODEL_FILE = MODEL_DIR / "nilm_xgboost_model.pkl"

MODEL_DIR.mkdir(parents=True, exist_ok=True)

# --------------------------------------------------
# Train NILM Model
# --------------------------------------------------
def train_nilm_model():
    """
    Trains an appliance-level NILM regression model.
    Predicts energy_kwh from usage features.
    """

    # Load dataset
    df = pd.read_csv(INPUT_FILE)

    # Features & target
    X = df[
        [
            "power_watts",
            "duration_minutes",
            "is_night",
            "is_idle",
            "appliance_code",
        ]
    ]

    y = df["energy_kwh"]

    # Train / test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42
    )

    # XGBoost model (stable & explainable)
    model = XGBRegressor(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.08,
        subsample=0.9,
        colsample_bytree=0.9,
        random_state=42,
    )

    # Train
    model.fit(X_train, y_train)

    # Evaluate
    preds = model.predict(X_test)
    mae = mean_absolute_error(y_test, preds)

    # Save model
    joblib.dump(model, MODEL_FILE)

    print("NILM ML model trained successfully")
    print(f"MAE: {mae:.4f}")
    print(f"Model saved at: {MODEL_FILE}")


if __name__ == "__main__":
    train_nilm_model()
