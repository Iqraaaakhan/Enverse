# backend/app/ml/train_forecast.py

import pandas as pd
import joblib
from pathlib import Path
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR.parent.parent / "data" / "nilm_training_data.csv"
MODEL_PATH = BASE_DIR / "energy_forecast_model.pkl"
MAE_REPORT_PATH = BASE_DIR / "mae_report.txt"

def train_estimation_model():
    if not DATA_PATH.exists():
        print("Run kaggle_importer.py first.")
        return

    df = pd.read_csv(DATA_PATH)

    # Features: Context-aware estimation
    features = ['power_watts', 'duration_minutes', 'is_night', 'is_occupied', 'temp_setting']
    X = df[features]
    y = df['energy_kwh']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = XGBRegressor(
        n_estimators=500,
        learning_rate=0.05,
        max_depth=6,
        n_jobs=-1
    )
    
    print("Training Context-Aware Estimation Model...")
    model.fit(X_train, y_train)

    mae = mean_absolute_error(y_test, model.predict(X_test))
    joblib.dump(model, MODEL_PATH)
    
    with open(MAE_REPORT_PATH, "w") as f:
        f.write(str(round(mae, 4)))

    print(f"Estimation Model Ready. MAE: {mae:.4f}")

if __name__ == "__main__":
    train_estimation_model()