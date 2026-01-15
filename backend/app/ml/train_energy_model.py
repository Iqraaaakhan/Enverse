import pandas as pd
import joblib
from pathlib import Path
import sys

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error

# ---------------------------------------------------------
# 1. ROBUST PATH SETUP (Fixes FileNotFoundError)
# ---------------------------------------------------------
# Get the directory where THIS script is located
BASE_DIR = Path(__file__).resolve().parent

# Navigate to data: backend/app/ml -> backend/app -> backend -> data
DATA_PATH = BASE_DIR.parents[1] / "data" / "processed_energy_data.csv"

# Model output directory
MODEL_DIR = BASE_DIR / "models"
MODEL_PATH = MODEL_DIR / "energy_estimation_model.pkl"

# Ensure the models directory exists
MODEL_DIR.mkdir(parents=True, exist_ok=True)

print(f"📍 Script Location: {BASE_DIR}")
print(f"📂 Looking for Data at: {DATA_PATH}")

if not DATA_PATH.exists():
    print(f"❌ ERROR: Data file not found at {DATA_PATH}")
    print("   Please run: python -m app.services.kaggle_importer")
    sys.exit(1)

# ---------------------------------------------------------
# 2. LOAD & TRAIN (Real AI Logic)
# ---------------------------------------------------------
print("TASKS: Loading dataset...")
df = pd.read_csv(DATA_PATH)

# Features & Target
X = df[
    [
        "appliance",
        "usage_duration_minutes",
        "temperature_setting_C",
        "occupancy_flag",
        "season",
        "day_of_week",
        "holiday",
    ]
]

y = df["energy_consumption_kWh"]

# Preprocessing Pipeline
cat_cols = ["appliance", "season", "day_of_week"]
num_cols = ["usage_duration_minutes", "temperature_setting_C", "occupancy_flag", "holiday"]

preprocessor = ColumnTransformer(
    [
        ("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols),
        ("num", "passthrough", num_cols),
    ]
)

# Using RandomForest - Industry standard for tabular regression
model = RandomForestRegressor(
    n_estimators=100,
    random_state=42,
    n_jobs=-1, # Use all CPU cores
)

pipeline = Pipeline(
    [
        ("prep", preprocessor),
        ("model", model),
    ]
)

print("TASKS: Training Random Forest Model (Real AI)...")
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

pipeline.fit(X_train, y_train)

preds = pipeline.predict(X_test)
mae = mean_absolute_error(y_test, preds)

joblib.dump(pipeline, MODEL_PATH)

print(f"✅ SUCCESS: Model trained!")
print(f"   MAE: {mae:.4f} (Mean Absolute Error)")
print(f"   Saved to: {MODEL_PATH}")