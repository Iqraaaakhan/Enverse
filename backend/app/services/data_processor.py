# backend/app/services/data_processor.py

import pandas as pd
import numpy as np
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BASE_DIR / "data"

def process_kaggle_data(input_filename: str):
    """
    Industry Standard: Data Cleaning & Transformation Pipeline.
    Converts raw Kaggle energy data into the Enverse 'energy_usage.csv' format.
    """
    raw_path = DATA_DIR / input_filename
    output_path = DATA_DIR / "energy_usage.csv"

    if not raw_path.exists():
        print(f"Error: {input_filename} not found in {DATA_DIR}")
        return

    print(f"--- STARTING PROFESSIONAL DATA PIPELINE ---")
    print(f"Reading: {input_filename}...")
    
    # Load data - handling potential semicolon separators common in Kaggle datasets
    try:
        df = pd.read_csv(raw_path, low_memory=False, sep=None, engine='python')
    except Exception as e:
        print(f"Read Error: {e}")
        return

    # 1. Standardize Timestamps
    # Detect common time column names
    time_cols = [c for c in df.columns if any(x in c.lower() for x in ['time', 'date', 'dt'])]
    if not time_cols:
        print("Error: No timestamp column detected.")
        return
    
    df['timestamp'] = pd.to_datetime(df[time_cols[0]], errors='coerce')
    df = df.dropna(subset=['timestamp']) # Remove rows with corrupt dates
    df['timestamp'] = df['timestamp'].dt.strftime('%Y-%m-%d %H:%M')

    # 2. Map Power Columns (Watts)
    # Kaggle often uses 'Global_active_power' in kW. We need Watts.
    power_cols = [c for c in df.columns if any(x in c.lower() for x in ['power', 'active', 'usage', 'kw'])]
    if not power_cols:
        print("Error: No power/usage column detected.")
        return
    
    # Convert to numeric, forcing errors to NaN then filling
    df['power_watts'] = pd.to_numeric(df[power_cols[0]], errors='coerce').fillna(0)
    
    # If values are small (e.g., < 50), assume they are in kW and convert to Watts
    if df['power_watts'].max() < 100:
        df['power_watts'] = df['power_watts'] * 1000

    # 3. Professional Device Disaggregation (NILM Simulation)
    # Since Kaggle datasets are often "Whole House", we distribute load to 16 categories
    devices = [
        "Bedroom AC", "Refrigerator", "Electric Kettle", "Geyser", 
        "Washing Machine", "Microwave Oven", "Gaming PC", "Home Theater",
        "Ceiling Fan", "Laptop Charger", "Living Room Light", "Smart TV",
        "Water Heater", "Dishwasher", "Bedroom Light", "Bedroom Fan"
    ]
    
    # Map device types for the Anomaly Detector logic
    device_type_map = {
        "AC": "ac", "Fan": "fan", "Light": "light", "Kettle": "kitchen",
        "Oven": "kitchen", "Machine": "appliance", "Geyser": "bathroom",
        "Heater": "bathroom", "TV": "entertainment", "PC": "entertainment",
        "Charger": "appliance", "Refrigerator": "appliance", "Dishwasher": "appliance"
    }

    df['device_name'] = np.resize(devices, len(df))
    df['device_type'] = df['device_name'].apply(
        lambda x: next((v for k, v in device_type_map.items() if k in x), "appliance")
    )

    # 4. Set standard duration (usually 60 mins for hourly Kaggle data)
    df['duration_minutes'] = 60 

    # 5. Final Selection & Performance Optimization
    final_df = df[['timestamp', 'device_name', 'device_type', 'power_watts', 'duration_minutes']]
    
    # Take the last 10,000 rows for high-performance real-time dashboarding
    final_df.tail(10000).to_csv(output_path, index=False)
    
    print(f"SUCCESS: {len(final_df.tail(10000))} rows processed.")
    print(f"Saved to: {output_path}")

if __name__ == "__main__":
    # This will be triggered once you provide the Kaggle filename
    import sys
    if len(sys.argv) > 1:
        process_kaggle_data(sys.argv[1])
    else:
        print("Usage: python data_processor.py <kaggle_file.csv>")