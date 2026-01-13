import pandas as pd
from pathlib import Path
from typing import List, Dict
import os

# Resolve path to data file safely
# This points to your data folder
DATA_DIR = Path(__file__).resolve().parents[2] / "data"

def load_energy_data(filename: str = "energy_usage.csv") -> List[Dict]:
    """
    Industry-standard data loader using Pandas.
    Converts CSV data into a list of dictionaries for the API.
    """
    file_path = DATA_DIR / filename
    
    # Check if file exists to prevent crashes
    if not os.path.exists(file_path):
        print(f"Warning: {file_path} not found. Returning empty list.")
        return []

    # Load using Pandas (Optimized for large Kaggle datasets)
    df = pd.read_csv(file_path)
    
    # Ensure timestamps are handled correctly
    if 'timestamp' in df.columns:
        df['timestamp'] = pd.to_datetime(df['timestamp']).dt.strftime('%Y-%m-%d %H:%M')

    # Convert to List of Dicts for FastAPI compatibility
    return df.to_dict(orient="records")

def get_pandas_df(filename: str = "energy_usage.csv") -> pd.DataFrame:
    """
    Returns the raw DataFrame for ML training.
    """
    file_path = DATA_DIR / filename
    if not os.path.exists(file_path):
        return pd.DataFrame()
    return pd.read_csv(file_path)