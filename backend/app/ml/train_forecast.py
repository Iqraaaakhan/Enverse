import pandas as pd
import joblib
import numpy as np
import sys
from pathlib import Path
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score

# 1. Setup Paths
BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parents[1]
DATA_PATH = PROJECT_ROOT / "data" / "energy_usage.csv"
MODEL_PATH = BASE_DIR / "models" / "energy_forecast_model.pkl"
MAE_REPORT_PATH = BASE_DIR / "mae_report.txt"

# Ensure app is in path
sys.path.append(str(PROJECT_ROOT))
from app.ml.metrics import save_metrics

def create_daily_features(df):
    """
    Resamples data to DAILY frequency for higher stability/accuracy.
    This removes hourly noise and improves R2 score.
    """
    df = df.copy()
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    
    # Resample to Daily Sums
    daily_df = df.set_index('timestamp').resample('D').agg({
        'energy_kwh': 'sum',
        'power_watts': 'mean' # Avg power load
    }).reset_index()
    
    # Feature Engineering
    daily_df['day_of_week'] = daily_df['timestamp'].dt.dayofweek
    daily_df['day_of_month'] = daily_df['timestamp'].dt.day
    
    # Lags (Autoregression)
    # Lag 1: Yesterday's consumption
    daily_df['lag_1'] = daily_df['energy_kwh'].shift(1)
    # Lag 7: Last week's consumption (same day)
    daily_df['lag_7'] = daily_df['energy_kwh'].shift(7)
    
    # Rolling Mean (Trend over last 7 days)
    daily_df['rolling_mean_7'] = daily_df['energy_kwh'].shift(1).rolling(window=7).mean()
    
    # Drop NaNs created by shifting
    return daily_df.dropna()

def train_forecast_model():
    print(f"🚀 Starting Daily Forecast Model Training...")
    
    if not DATA_PATH.exists():
        print(f"❌ Data not found at {DATA_PATH}")
        return

    # 2. Load Real Data
    df = pd.read_csv(DATA_PATH)
    
    # 3. Process Data (Daily Aggregation)
    df_processed = create_daily_features(df)
    
    # Define Features
    features = ['day_of_week', 'day_of_month', 'lag_1', 'lag_7', 'rolling_mean_7']
    target = 'energy_kwh'
    
    X = df_processed[features]
    y = df_processed[target]

    # 4. Split Data (Time-based)
    split_idx = int(len(X) * 0.85)
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]

    # 5. Train XGBoost (Optimized for Daily)
    model = XGBRegressor(
        n_estimators=200,
        learning_rate=0.05,
        max_depth=4,
        n_jobs=-1,
        random_state=42
    )
    model.fit(X_train, y_train)

    # 6. Evaluation
    preds = model.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    r2 = r2_score(y_test, preds)

    # 7. Save Model & Metrics
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    
    with open(MAE_REPORT_PATH, "w") as f:
        f.write(f"{mae:.4f}")

    save_metrics(
        model_name="Daily Forecast XGBoost",
        dataset_name="Energy Usage (Daily Agg)",
        metrics_dict={
            "MAE": round(mae, 4),
            "R2_Score": round(r2, 4)
        }
    )

    print(f"✅ Daily Model Trained. MAE: {mae:.4f} | R2: {r2:.4f}")

if __name__ == "__main__":
    train_forecast_model()