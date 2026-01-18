#!/usr/bin/env python3
"""
Safe diagnostic for Enverse models
"""
import pandas as pd
import sys
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent.parent
DATA_PATH = BASE_DIR / "data" / "processed" / "energy_usage.csv"

def diagnose():
    print("🔍 ENVERSE MODEL DIAGNOSTIC")
    print("=" * 50)
    
    # 1. Check if data exists
    if not DATA_PATH.exists():
        print(f"❌ Data file not found: {DATA_PATH}")
        return False
    
    # 2. Load and inspect data
    try:
        df = pd.read_csv(DATA_PATH)
        print(f"✅ Data loaded: {df.shape[0]} rows, {df.shape[1]} columns")
        print("\n📊 COLUMNS AVAILABLE:")
        for i, col in enumerate(df.columns):
            print(f"  {i+1:2d}. {col:25s} | Dtype: {df[col].dtype}")
        
        print("\n🎯 CRITICAL CHECKS:")
        
        # Check for energy_kwh (from your screenshots)
        if "energy_kwh" in df.columns:
            print(f"✅ 'energy_kwh' column exists")
            print(f"   Min: {df['energy_kwh'].min():.2f}, Max: {df['energy_kwh'].max():.2f}")
        else:
            print("❌ 'energy_kwh' column missing!")
        
        # Check for energy_consumption_kwh (suspected error)
        if "energy_consumption_kwh" in df.columns:
            print("⚠️  'energy_consumption_kwh' exists - might be duplicate")
        else:
            print("✅ 'energy_consumption_kwh' not found (expected)")
        
        # Check model features from screenshots
        required_features = ["power_watts", "duration_minutes"]
        missing = [f for f in required_features if f not in df.columns]
        if missing:
            print(f"❌ Missing features: {missing}")
        else:
            print(f"✅ All required features present")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    diagnose()