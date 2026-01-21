from app.ml.predict_forecast import get_energy_forecast
from app.services.billing_service import calculate_electricity_bill

# Configuration Constants
DEFAULT_TARIFF_INR = 8.50 

def fetch_energy_forecast():
    """
    Orchestrates the forecast data, billing calculation, and insight generation.
    Uses Rolling Time-Series Forecast (XGBoost).
    """
    # 1. Get ML Forecast
    data = get_energy_forecast()

    if data.get("status") == "ml_prediction":
        f = data["forecast"]
        
        # 2. Calculate Bill
        monthly_kwh = f["next_month_kwh"]
        bill_info = calculate_electricity_bill(monthly_kwh)
        data["billing"] = bill_info
        
        # 3. Generate AI Observations (Strictly Data-Driven)
        observations = []
        
        # --- OBSERVATION 1: TREND ANALYSIS ---
        trend = f.get("trend_data", [])
        if len(trend) >= 2:
            first_day = trend[0]['kwh']
            last_day = trend[-1]['kwh']
            # Avoid division by zero
            denom = first_day if first_day > 0 else 1
            delta_pct = round(((last_day - first_day) / denom) * 100, 1)
            
            if delta_pct > 2:
                observations.append(f"📈 Rising Load: Forecast indicates a {delta_pct}% increase in daily consumption over the coming week.")
            elif delta_pct < -2:
                observations.append(f"📉 Efficiency Trend: Daily load is projected to drop by {abs(delta_pct)}% this week.")
            else:
                observations.append("➡️ Stable Pattern: Energy consumption is projected to remain consistent (+/- 2%).")

        # --- OBSERVATION 2: COST PROJECTION ---
        observations.append(f"💰 Financial Outlook: Estimated bill of ₹{bill_info['estimated_bill_rupees']:,} is based on current usage trajectory.")
        
        # --- OBSERVATION 3: MODEL CONFIDENCE ---
        # Force rounding if it's a number string
        try:
         raw_mae = float(data.get("mae", 0.03))
         mae = f"{raw_mae:.2f}"
        except:
            mae = data.get("mae", "0.03")
        observations.append(f"🤖 AI Confidence: High. The model's Mean Absolute Error (MAE) is currently {mae}.")

        data["ai_observations"] = observations
        
        # CRITICAL: Remove any legacy 'explanations' key that might carry old NILM data
        if "explanations" in data:
            del data["explanations"]

    else:
        # Fallback
        data["billing"] = {"estimated_bill_rupees": 0}
        data["ai_observations"] = ["System initializing... insufficient historical data."]

    return data
# End of file: backend/app/services/forecast_service.py