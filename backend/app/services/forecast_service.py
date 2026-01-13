# backend/app/services/forecast_service.py

from app.ml.predict_forecast import get_energy_forecast
from app.services.billing_service import calculate_electricity_bill

def fetch_energy_forecast():
    """
    Bridge between FastAPI and the ML Prediction layer.
    Calculates estimated bills based on ML forecasts.
    """
    # Get the prediction from the XGBoost model
    forecast_data = get_energy_forecast()

    # If the ML model successfully predicted values
    if forecast_data.get("status") == "ml_prediction":
        monthly_units = forecast_data["forecast"]["next_month_kwh"]
        
        # Calculate the bill based on the ML prediction
        bill_info = calculate_electricity_bill(monthly_units)
        forecast_data["billing"] = bill_info

    return forecast_data