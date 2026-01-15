import pandas as pd
import joblib
from pathlib import Path
import sys
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

# ---------------------------------------------------------
# 1. ROBUST PATH SETUP
# ---------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR.parents[1] / "data" / "processed_energy_data.csv"
MODEL_DIR = BASE_DIR / "models"
MODEL_PATH = MODEL_DIR / "anomaly_isolation_forest.pkl"

MODEL_DIR.mkdir(parents=True, exist_ok=True)

if not DATA_PATH.exists():
    print(f"❌ ERROR: Data file not found at {DATA_PATH}")
    sys.exit(1)

def train_anomaly_model():
    print("TASKS: Loading dataset for Anomaly Detection...")
    df = pd.read_csv(DATA_PATH)

    # Features relevant to anomalies:
    # High energy + Low duration = Anomaly?
    # High energy + Unoccupied = Anomaly?
    features = [
        "appliance", 
        "usage_duration_minutes", 
        "energy_consumption_kWh", 
        "occupancy_flag"
    ]
    
    X = df[features]

    # Preprocessing
    # We need to encode 'appliance' and scale numerical values
    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore'), ['appliance']),
            ('num', StandardScaler(), ['usage_duration_minutes', 'energy_consumption_kWh', 'occupancy_flag'])
        ]
    )

    # Isolation Forest Model
    # contamination=0.05 means we expect ~5% of data to be anomalies
    model = IsolationForest(
        n_estimators=100, 
        contamination=0.001,  # <--- VERY LOW to catch only extreme spikes
        random_state=42, 
        n_jobs=-1
    )

    pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('model', model)
    ])

    print("TASKS: Training Isolation Forest (Unsupervised Learning)...")
    pipeline.fit(X)

    # Save
    joblib.dump(pipeline, MODEL_PATH)

    print(f"✅ SUCCESS: Anomaly Model trained!")
    print(f"   Saved to: {MODEL_PATH}")

if __name__ == "__main__":
    train_anomaly_model()