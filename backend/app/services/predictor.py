import joblib
import pandas as pd
from pathlib import Path

# -------------------------------------------------
# Path to trained ML model
# -------------------------------------------------
MODEL_PATH = Path(__file__).resolve().parents[1] / "ml" / "energy_forecast_model.pkl"


class EnergyPredictor:
    """
    Energy prediction service.
    Uses ML when possible, physics fallback always available.
    Supports SYSTEM and WHAT-IF modes.
    """

    def __init__(self):
        self.model = None
        self.load_model()

    def load_model(self):
        if MODEL_PATH.exists():
            self.model = joblib.load(MODEL_PATH)
            print("✅ Energy prediction model loaded")
        else:
            print("⚠️ ML model not found, physics fallback active")

    def predict_energy(
        self,
        power_watts: float,
        duration_minutes: int,
        mode: str = "system"  # "system" | "what_if"
    ) -> dict:
        """
        Predict energy usage.

        system  → realistic, bounded, used by dashboard/KPIs
        what_if → exploratory, user-driven, hypothetical
        """

        # -------------------------------------------------
        # Physical sanity (ALWAYS enforced)
        # -------------------------------------------------
        power_watts = max(50, min(float(power_watts), 3500))

        # -------------------------------------------------
        # Duration rules
        # -------------------------------------------------
        if mode == "system":
            # real household constraints (max 1 day)
            duration_minutes = max(1, min(int(duration_minutes), 1440))
        else:
            # what-if exploration (no upper bound)
            duration_minutes = max(1, int(duration_minutes))

        # -------------------------------------------------
        # Physics baseline (guaranteed)
        # -------------------------------------------------
        physics_kwh = (power_watts * duration_minutes) / 60 / 1000

        # -------------------------------------------------
        # ML prediction (if model available)
        # -------------------------------------------------
        if self.model is not None:
            try:
                input_df = pd.DataFrame([{
                    "power_watts": power_watts,
                    "duration_minutes": duration_minutes
                }])

                ml_pred = float(self.model.predict(input_df)[0])
                energy_kwh = max(0.0, ml_pred)

            except Exception as e:
                print(f"⚠️ ML prediction failed, fallback used: {e}")
                energy_kwh = physics_kwh
        else:
            energy_kwh = physics_kwh

        # -------------------------------------------------
        # Final response
        # -------------------------------------------------
        return {
            "energy_kwh": round(energy_kwh, 3),
            "mode": mode,
            "hypothetical": mode == "what_if"
        }
