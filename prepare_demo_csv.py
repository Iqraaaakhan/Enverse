import pandas as pd
from datetime import datetime, timedelta

BACKUP = "backend/data/energy_usage.localbackup.csv"
OUTPUT = "backend/data/energy_usage.csv"

df = pd.read_csv(BACKUP)

# --- 1. Timestamp shift (preserve spacing) ---
df["timestamp"] = pd.to_datetime(df["timestamp"])

old_start = df["timestamp"].min()
new_start = pd.Timestamp("2025-10-01 00:00:00")
shift = new_start - old_start

df["timestamp"] = df["timestamp"] + shift

# --- 2. Spike ONLY last 3 AC rows ---
ac_mask = df["device_name"] == "Residential Cooling (AC)"
ac_indices = df[ac_mask].tail(3).index

for i in ac_indices:
    df.loc[i, "energy_kwh"] *= 1.25
    df.loc[i, "power_watts"] *= 1.15

# --- 3. Write output ---
df.to_csv(OUTPUT, index=False)

print("✅ Demo CSV prepared safely.")
print("Only timestamps + last 3 AC rows modified.")
