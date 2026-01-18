import json
import os
from pathlib import Path
from datetime import datetime

# Define path relative to this file
BASE_DIR = Path(__file__).resolve().parent
METRICS_FILE = BASE_DIR / "metrics.json"

def get_latest_metrics():
    """
    Reads the real-time training metrics.
    Used by the Dashboard API to show Model Health.
    """
    if not METRICS_FILE.exists():
        return {}
    
    try:
        with open(METRICS_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return {}

def save_metrics(model_name, dataset_name, metrics_dict):
    """
    Saves training results to JSON.
    This is called by the training scripts (train_forecast.py, etc.) 
    after the model has been evaluated on real data.
    """
    # Load existing data
    current_data = get_latest_metrics()
    
    # Update with new run data
    current_data[model_name] = {
        "model": model_name,
        "dataset": dataset_name,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "metrics": metrics_dict
    }
    
    # Write back to disk
    with open(METRICS_FILE, "w") as f:
        json.dump(current_data, f, indent=4)
    
    print(f"📊 Metrics for {model_name} saved to {METRICS_FILE}")