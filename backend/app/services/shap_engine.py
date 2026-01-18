# Folder: backend/app/services
# File: shap_engine.py

import shap
import joblib
import pandas as pd
import numpy as np
from pathlib import Path

# Load Model Paths
BASE_DIR = Path(__file__).resolve().parents[2]
MODEL_PATH = BASE_DIR / "app" / "ml" / "energy_forecast_model.pkl"

_explainer = None
_model = None

def load_resources():
    global _explainer, _model
    if _model is None and MODEL_PATH.exists():
        _model = joblib.load(MODEL_PATH)
        # TreeExplainer is optimized for XGBoost
        _explainer = shap.TreeExplainer(_model)
        print("✅ SHAP Explainer Loaded")

def explain_prediction_shap(input_data: dict):
    """
    Generates Real SHAP values for a single prediction.
    """
    load_resources()
    
    if _model is None:
        return {"error": "Model not loaded"}

    # Convert input dict to DataFrame (Must match training features exactly)
    # Features: ['power_watts', 'duration_minutes', 'is_night', 'is_occupied', 'temp_setting']
    features = ['power_watts', 'duration_minutes', 'is_night', 'is_occupied', 'temp_setting']
    
    # Ensure defaults if missing
    row = [
        input_data.get('power_watts', 0),
        input_data.get('duration_minutes', 60),
        input_data.get('is_night', 0),
        input_data.get('is_occupied', 1),
        input_data.get('temp_setting', 24)
    ]
    
    df = pd.DataFrame([row], columns=features)
    
    # Calculate SHAP values
    shap_values = _explainer.shap_values(df)
    
    # If shap_values is a list (some versions), take first
    if isinstance(shap_values, list):
        vals = shap_values[0]
    else:
        vals = shap_values[0] # Single row

    # Create structured explanation
    explanation = []
    for feat, val in zip(features, vals):
        explanation.append({
            "feature": feat,
            "impact": float(val), # +ve increases energy, -ve decreases
            "direction": "increase" if val > 0 else "decrease"
        })

    # Sort by absolute impact (biggest drivers first)
    explanation.sort(key=lambda x: abs(x['impact']), reverse=True)

    # --- REAL NLP GENERATION (Dynamic) ---
    top_factor = explanation[0]
    nlp_text = generate_nlp(top_factor, input_data)

    return {
        "shap_details": explanation,
        "nlp_explanation": nlp_text
    }

def generate_nlp(factor, inputs):
    """
    Converts mathematical SHAP impact into human language.
    """
    feat = factor['feature']
    impact = factor['impact']
    
    if feat == "power_watts":
        if impact > 0: return f"High appliance power ({inputs.get('power_watts')}W) is the main driver of energy cost."
        return "Low power wattage is keeping consumption minimal."
        
    if feat == "duration_minutes":
        if impact > 0: return f"Running this device for {inputs.get('duration_minutes')} mins significantly adds to the load."
        return "Short usage duration is helping save energy."

    if feat == "is_night":
        if impact > 0: return "Night-time usage tariffs or cooling load are increasing the estimate."
        return "Daytime usage patterns are stabilizing the prediction."

    if feat == "is_occupied":
        return "Household occupancy is contributing to active energy consumption."

    return f"The factor '{feat}' had a {factor['direction']}d impact on usage."