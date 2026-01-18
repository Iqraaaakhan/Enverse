import pandas as pd
import joblib
import numpy as np
import sys
from pathlib import Path
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# 1. Setup Paths
BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parents[1]
DATA_PATH = PROJECT_ROOT / "data" / "nilm_training_data.csv"
MODEL_PATH = BASE_DIR / "models" / "energy_forecast_model.pkl"

# Ensure app is in path for imports
sys.path.append(str(PROJECT_ROOT))
from app.ml.metrics import save_metrics

def train_forecast_model():
    print(f"🚀 Starting Forecast Model Training...")
    
    if not DATA_PATH.exists():
        print(f"❌ Data not found at {DATA_PATH}. Run kaggle_importer.py first.")
        return

    # 2. Load Real Data
    df = pd.read_csv(DATA_PATH)
    
    # 3. Feature Selection (Context-Aware)
    features = ['power_watts', 'duration_minutes', 'is_night', 'is_occupied', 'temp_setting']
    target = 'energy_kwh'
    
    X = df[features]
    y = df[target]

    # 4. Split Data (80/20 Real Split)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # 5. Train XGBoost (Gradient Boosting)
    model = XGBRegressor(
        n_estimators=500,
        learning_rate=0.05,
        max_depth=6,
        n_jobs=-1,
        random_state=42
    )
    model.fit(X_train, y_train)

    # 6. Real Evaluation
    preds = model.predict(X_test)
    
    r2 = r2_score(y_test, preds)
    rmse = np.sqrt(mean_squared_error(y_test, preds))
    mae = mean_absolute_error(y_test, preds)
    
    # Calculate MAPE (Mean Absolute Percentage Error) safely
    # Avoid division by zero
    mask = y_test != 0
    mape = np.mean(np.abs((y_test[mask] - preds[mask]) / y_test[mask])) * 100

    # 7. Save Model & Metrics
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)

    save_metrics(
        model_name="Energy Forecast XGBoost",
        dataset_name="KAGGLE HOME DATA (80/20 SPLIT)",
        metrics_dict={
            "R2_Score": round(r2, 4),
            "RMSE": round(rmse, 4),
            "MAE": round(mae, 4),
            "MAPE": round(mape, 2)
        }
    )

    print(f"✅ Forecast Model Trained. R2: {r2:.4f} | RMSE: {rmse:.4f}")

if __name__ == "__main__":
    train_forecast_model()