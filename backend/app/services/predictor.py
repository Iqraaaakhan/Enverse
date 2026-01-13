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
        Uses the XGBoost model to predict energy for manual user input.
        """
        if not self.model:
            # Fallback to physics if model isn't trained yet
            return round((power_watts * duration_minutes) / 60000, 4)

        # Get current time features (Realism: AI knows what time it is 'now')
        now = datetime.datetime.now()
        hour = now.hour
        day_of_week = now.weekday()

        # Create a DataFrame for the model (Features: power, duration, hour, day)
        input_df = pd.DataFrame([{
            "power_watts": power_watts,
            "duration_minutes": duration_minutes,
            "hour": hour,
            "day_of_week": day_of_week
        }])

        # Predict using XGBoost
        prediction = float(self.model.predict(input_df)[0])
        
        # Ensure we don't return negative values (ML noise)
        return round(max(0, prediction), 4)