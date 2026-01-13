# backend/app/ml/train_forecast.py

import pandas as pd
import joblib
from pathlib import Path
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error

# Paths
BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR.parent.parent / "data" / "energy_usage.csv"
MODEL_PATH = BASE_DIR / "energy_forecast_model.pkl"
MAE_REPORT_PATH = BASE_DIR / "mae_report.txt"

def train_forecast_model():
    if not DATA_PATH.exists():
        return

    df = pd.read_csv(DATA_PATH)
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df['hour'] = df['timestamp'].dt.hour
    df['day_of_week'] = df['timestamp'].dt.dayofweek
    
    df['energy_kwh'] = (df['power_watts'] * df['duration_minutes']) / 60000

    features = ['power_watts', 'duration_minutes', 'hour', 'day_of_week']
    X = df[features]
    y = df['energy_kwh']

    # Professional Split: 80% Train, 20% Test
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Elite XGBoost Parameters for large data
    model = XGBRegressor(
        n_estimators=500,
        learning_rate=0.05,
        max_depth=6,
        subsample=0.8,
        colsample_bytree=0.8,
        n_jobs=-1 # Use all CPU cores for speed
    )
    
    model.fit(X_train, y_train)

    mae = mean_absolute_error(y_test, model.predict(X_test))
    joblib.dump(model, MODEL_PATH)
    
    with open(MAE_REPORT_PATH, "w") as f:
        f.write(str(round(mae, 4)))

    print(f"BIG DATA TRAINING COMPLETE. MAE: {mae:.4f}")

if __name__ == "__main__":
    train_forecast_model()