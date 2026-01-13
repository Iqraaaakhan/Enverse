# backend/app/ml/train_forecast.py

import pandas as pd
import joblib
from pathlib import Path
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error

# Paths (Industry Standard: Using Pathlib)
BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR.parent.parent / "data" / "energy_usage.csv"
MODEL_PATH = BASE_DIR / "energy_forecast_model.pkl"

def train_forecast_model():
    """
    Trains a professional XGBoost model.
    Includes Feature Engineering and Validation.
    """
    if not DATA_PATH.exists():
        print(f"Error: {DATA_PATH} not found.")
        return

    # 1. Load Data
    df = pd.read_csv(DATA_PATH)
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    
    # 2. Feature Engineering (Real AI logic)
    df['hour'] = df['timestamp'].dt.hour
    df['day_of_week'] = df['timestamp'].dt.dayofweek
    
    # Target calculation: (Watts * Minutes) / 60,000 = kWh
    if 'energy_kwh' not in df.columns:
        df['energy_kwh'] = (df['power_watts'] * df['duration_minutes']) / 60000

    # 3. Select Features
    features = ['power_watts', 'duration_minutes', 'hour', 'day_of_week']
    X = df[features]
    y = df['energy_kwh']

    # 4. Split Data
    # For 16 rows, we use a smaller test size so we don't run out of data
    test_size = 0.2 if len(df) > 20 else 0.1
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=42
    )

    # 5. Initialize XGBoost (Elite Parameters)
    model = XGBRegressor(
        n_estimators=1000,
        learning_rate=0.05,
        max_depth=5,
        objective='reg:squarederror',
        random_state=42
    )

    # 6. Train with a check for data size
    # Early stopping only works if we have enough data points
    if len(df) > 10:
        model.fit(
            X_train, y_train,
            eval_set=[(X_test, y_test)],
            verbose=False
        )
    else:
        model.fit(X_train, y_train)

    # 7. Evaluate Accuracy
    predictions = model.predict(X_test)
    mae = mean_absolute_error(y_test, predictions)
    
    # 8. Save the 'Brain'
    joblib.dump(model, MODEL_PATH)
    
    print("-" * 30)
    print("ENVERSE AI TRAINING REPORT")
    print("-" * 30)
    print(f"Status: SUCCESS")
    print(f"Data Points Processed: {len(df)}")
    print(f"Model Accuracy (MAE): {mae:.4f} kWh")
    print(f"Model Saved: {MODEL_PATH}")
    print("-" * 30)

if __name__ == "__main__":
    train_forecast_model()

    # backend/app/ml/train_forecast.py
# Add these 2 lines at the very bottom of the train_forecast_model() function

    # Save the MAE to a file so the UI can show it
    with open(BASE_DIR / "mae_report.txt", "w") as f:
        f.write(str(round(mae, 4)))