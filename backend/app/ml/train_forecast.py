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

# Load dataset
df = pd.read_csv(DATA_PATH)

# -----------------------------
# FEATURE ENGINEERING (KEY PART)
# -----------------------------

# Convert minutes to hours
df["duration_hours"] = df["duration_minutes"] / 60

# Energy calculation (kWh)
df["energy_kwh"] = (df["power_watts"] * df["duration_hours"]) / 1000

# Convert timestamp
df["timestamp"] = pd.to_datetime(df["timestamp"])
df["date"] = df["timestamp"].dt.date

# Aggregate per day (realistic forecasting target)
daily_df = df.groupby("date").agg({
    "power_watts": "mean",
    "duration_minutes": "sum",
    "energy_kwh": "sum"
}).reset_index()

# -----------------------------
# ML DATA
# -----------------------------
X = daily_df[["power_watts", "duration_minutes"]]
y = daily_df["energy_kwh"]

# Train–test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# XGBoost model
model = XGBRegressor(
    n_estimators=100,
    max_depth=3,
    learning_rate=0.1,
    objective="reg:squarederror",
    random_state=42
)

# Train
model.fit(X_train, y_train)

# Evaluate
preds = model.predict(X_test)
mae = mean_absolute_error(y_test, preds)

print(f"XGBoost trained successfully | MAE: {mae:.4f}")

# Save model
joblib.dump(model, MODEL_PATH)
print(f"Model saved at: {MODEL_PATH}")
