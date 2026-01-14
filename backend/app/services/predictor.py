# backend/app/services/predictor.py

import joblib
import pandas as pd
from pathlib import Path
import datetime

# Path to the trained brain
MODEL_PATH = Path(__file__).resolve().parents[1] / "ml" / "energy_forecast_model.pkl"

class EnergyPredictor:
    def __init__(self):
        self.model = None
        self.load_model()

    def load_model(self):
        if MODEL_PATH.exists():
            self.model = joblib.load(MODEL_PATH)

    def predict(self, power_watts: float, duration_minutes: float) -> float:
        """
        Uses the XGBoost model to estimate energy for manual user input.
        Updated to support the 5-feature Kaggle-trained model.
        """
        if not self.model:
            # Fallback to physics if model isn't trained yet
            return round((power_watts * duration_minutes) / 60000, 4)

        # 1. Contextual Feature Engineering
        now = datetime.datetime.now()
        is_night = 1 if now.hour >= 22 or now.hour <= 6 else 0
        
        # We assume 'Occupied' and a standard 'Temp' for manual what-if analysis
        is_occupied = 1 
        temp_setting = 22.0 

        # 2. Create DataFrame with all 5 features required by the new model
        input_df = pd.DataFrame([{
            "power_watts": power_watts,
            "duration_minutes": duration_minutes,
            "is_night": is_night,
            "is_occupied": is_occupied,
            "temp_setting": temp_setting
        }])

        # 3. Predict using XGBoost
        try:
            prediction = float(self.model.predict(input_df)[0])
            # Ensure we don't return negative values (ML noise)
            return round(max(0, prediction), 4)
        except Exception as e:
            print(f"Prediction Error: {e}")
            # Fallback to physics if feature mismatch occurs
            return round((power_watts * duration_minutes) / 60000, 4)