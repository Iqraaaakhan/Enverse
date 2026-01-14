import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error

DATA_PATH = "../../data/processed_energy_data.csv"
MODEL_PATH = "models/energy_estimation_model.pkl"

df = pd.read_csv(DATA_PATH)

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

cat_cols = ["appliance", "season", "day_of_week"]
num_cols = ["usage_duration_minutes", "temperature_setting_C", "occupancy_flag", "holiday"]

preprocessor = ColumnTransformer(
    [
        ("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols),
        ("num", "passthrough", num_cols),
    ]
)
model = RandomForestRegressor(
    n_estimators=200,
    random_state=42,
    n_jobs=1,
)



pipeline = Pipeline(
    [
        ("prep", preprocessor),
        ("model", model),
    ]
)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

pipeline.fit(X_train, y_train)

preds = pipeline.predict(X_test)
mae = mean_absolute_error(y_test, preds)

joblib.dump(pipeline, MODEL_PATH)

print(f"Model trained. MAE = {mae:.4f}")
