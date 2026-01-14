import joblib
import pandas as pd

MODEL_PATH = "app/ml/models/energy_estimation_model.pkl"

model = joblib.load(MODEL_PATH)

def estimate_energy(payload: dict):
    df = pd.DataFrame([payload])
    prediction = model.predict(df)[0]
    return round(float(prediction), 4)
