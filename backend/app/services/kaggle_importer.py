# backend/app/services/kaggle_importer.py

import pandas as pd
import numpy as np
from pathlib import Path

# Paths
PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = PROJECT_ROOT / "data"
INPUT_FILE = DATA_DIR / "smart_home_energy_usage_dataset.csv"
OUTPUT_ENERGY = DATA_DIR / "energy_usage.csv"
OUTPUT_NILM = DATA_DIR / "nilm_training_data.csv"

# Stable Mapping for Industry Consistency
APPLIANCE_MAP = {
    'HVAC': 0,
    'Refrigerator': 1,
    'Electronics': 2,
    'Dishwasher': 3,
    'Washing Machine': 4,
    'Lighting': 5
}

DEVICE_TYPE_MAP = {
    'HVAC': 'ac',
    'Refrigerator': 'appliance',
    'Electronics': 'entertainment',
    'Dishwasher': 'appliance',
    'Washing Machine': 'appliance',
    'Lighting': 'light'
}

def import_and_clean_data():
    if not INPUT_FILE.exists():
        print(f"Error: {INPUT_FILE} not found in data folder.")
        return

    print("Reading Kaggle Dataset...")
    df = pd.read_csv(INPUT_FILE)

    # 1. Technical Guard: Remove 0 duration to prevent division by zero
    df = df[df['usage_duration_minutes'] > 0]

    # 2. Filter for Home ID 3 (Single Household Simulation)
    df_home = df[df['home_id'] == 3].copy()

    # 3. Feature Engineering: Calculate Power (Watts)
    df_home['power_watts'] = (df_home['energy_consumption_kWh'] * 60000) / df_home['usage_duration_minutes']
    
    # 4. Apply Stable Mappings
    df_home['device_type'] = df_home['appliance'].map(DEVICE_TYPE_MAP).fillna('appliance')
    df_home['appliance_code'] = df_home['appliance'].map(APPLIANCE_MAP).fillna(-1)

    # 5. Dashboard Data (Last 5000 records for UI speed)
    dashboard_df = df_home[['timestamp', 'appliance', 'device_type', 'power_watts', 'usage_duration_minutes']].copy()
    dashboard_df.columns = ['timestamp', 'device_name', 'device_type', 'power_watts', 'duration_minutes']
    dashboard_df.tail(5000).to_csv(OUTPUT_ENERGY, index=False)

    # 6. ML Training Data (Context-Aware Features)
    nilm_df = df_home.copy()
    nilm_df['is_night'] = pd.to_datetime(nilm_df['timestamp']).dt.hour.apply(lambda x: 1 if x >= 22 or x <= 6 else 0)
    nilm_df['is_occupied'] = nilm_df['occupancy_status'].map({'Occupied': 1, 'Unoccupied': 0})
    
    final_nilm = nilm_df[[
        'appliance_code', 'power_watts', 'usage_duration_minutes', 
        'is_night', 'is_occupied', 'temperature_setting_C', 'energy_consumption_kWh'
    ]]
    final_nilm.columns = ['appliance_code', 'power_watts', 'duration_minutes', 'is_night', 'is_occupied', 'temp_setting', 'energy_kwh']
    final_nilm.to_csv(OUTPUT_NILM, index=False)

    print(f"SUCCESS: Processed {len(df_home)} records for Home ID 3.")
    print(f"Dashboard data saved to: {OUTPUT_ENERGY}")
    print(f"ML Training data saved to: {OUTPUT_NILM}")

if __name__ == "__main__":
    import_and_clean_data()
    