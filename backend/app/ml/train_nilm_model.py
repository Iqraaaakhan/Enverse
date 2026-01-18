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
MODEL_PATH = BASE_DIR / "models" / "nilm_xgboost_model.pkl"

sys.path.append(str(PROJECT_ROOT))
from app.ml.metrics import save_metrics

def train_nilm():
    print(f"🚀 Starting NILM Disaggregator Training...")

    if not DATA_PATH.exists():
        print("❌ Data missing.")
        return

    df = pd.read_csv(DATA_PATH)

    # 3. Features for Disaggregation
    # We use appliance code as a feature here to simulate 'signature' recognition training
    # In a full blind NILM, we would train separate models per appliance.
    # For this project scope, a unified regressor with appliance context is efficient.
    features = ['power_watts', 'duration_minutes', 'is_night', 'is_occupied', 'appliance_code']
    target = 'energy_kwh'

    X = df[features]
    y = df[target]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)

    # 4. Train Model
    model = XGBRegressor(
        n_estimators=300,
        learning_rate=0.08,
        max_depth=5,
        n_jobs=-1,
        random_state=42
    )
    model.fit(X_train, y_train)

    # 5. Calculate Real Metrics
    preds = model.predict(X_test)
    
    r2 = r2_score(y_test, preds)
    rmse = np.sqrt(mean_squared_error(y_test, preds))
    mae = mean_absolute_error(y_test, preds)
    
    mask = y_test != 0
    mape = np.mean(np.abs((y_test[mask] - preds[mask]) / y_test[mask])) * 100

    # 6. Save
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)

    save_metrics(
        model_name="NILM Disaggregator",
        dataset_name="APPLIANCE SIGNATURES (75/25 SPLIT)",
        metrics_dict={
            "R2_Score": round(r2, 4),
            "RMSE": round(rmse, 4),
            "MAE": round(mae, 4),
            "MAPE": round(mape, 2)
        }
    )

    print(f"✅ NILM Model Trained. R2: {r2:.4f}")

if __name__ == "__main__":
    train_nilm()