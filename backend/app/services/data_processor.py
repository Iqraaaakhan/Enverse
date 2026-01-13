# backend/app/services/data_processor.py

import pandas as pd
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
        print(f"Error: {input_filename} not found in data folder.")
        return

    print(f"Reading {input_filename}...")
    df = pd.read_csv(raw_path)

    # --- PROFESSIONAL CLEANING LOGIC ---
    # 1. Standardize Timestamps
    # Kaggle files often use 'Date' or 'time'. We convert to our 'timestamp'
    time_col = [col for col in df.columns if 'time' in col.lower() or 'date' in col.lower()][0]
    df['timestamp'] = pd.to_datetime(df[time_col]).dt.strftime('%Y-%m-%d %H:%M')

    # 2. Map Power Columns
    # If Kaggle uses 'Global_active_power', we convert it to 'power_watts'
    power_col = [col for col in df.columns if 'power' in col.lower() or 'usage' in col.lower()][0]
    # Convert to Watts if data is in kW (Common in Kaggle)
    if df[power_col].max() < 100: 
        df['power_watts'] = df[power_col] * 1000
    else:
        df['power_watts'] = df[power_col]

    # 3. Assign Devices (Since Kaggle often monitors the whole house)
    # We distribute the data among your 16 professional device categories
    devices = [
        "Bedroom AC", "Refrigerator", "Electric Kettle", "Geyser", 
        "Washing Machine", "Microwave Oven", "Gaming PC", "Home Theater",
        "Ceiling Fan", "Laptop Charger", "Living Room Light", "Smart TV",
        "Water Heater", "Dishwasher", "Bedroom Light", "Bedroom Fan"
    ]
    
    # Create a repeating list of devices to fill the rows
    import numpy as np
    df['device_name'] = np.resize(devices, len(df))
    
    # Simple mapping for device types
    df['device_type'] = df['device_name'].apply(lambda x: x.split()[-1].lower())

    # 4. Set standard duration
    df['duration_minutes'] = 60 

    # 5. Select final columns and save
    final_df = df[['timestamp', 'device_name', 'device_type', 'power_watts', 'duration_minutes']]
    
    # Only take the last 5000 rows for performance (Industry standard for 'Recent History')
    final_df.tail(5000).to_csv(output_path, index=False)
    
    print(f"SUCCESS: {len(final_df.tail(5000))} rows processed and saved to energy_usage.csv")

if __name__ == "__main__":
    # Change this to your actual Kaggle filename when you download it
    process_kaggle_data("your_kaggle_file.csv")