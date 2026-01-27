# Device name normalization (aliases)
DEVICE_NAME_MAP = {
    "Residential Cooling (AC)": "Air Conditioner",
    "AC": "Air Conditioner",
    # Add more aliases as needed
}
"""
Smart Alert Detection Service
Analyzes recent energy data to detect continuous device operation
and generates actionable alerts for user safety and cost prevention.
"""

import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any
from app.services.data_loader import load_energy_data


# -------------------------------------------------
# Device-Specific Alert Thresholds (Hours)
# -------------------------------------------------
ALERT_THRESHOLDS = {
    "Air Conditioner": {
        "warning": 2.0,    # Alert after 2 hours
        "critical": 4.0,   # Critical after 4 hours
    },
    "Washing Machine": {
        "warning": 3.0,    # Alert after 3 hours
        "critical": 5.0,
    },
    "Electronics": {
        "warning": 4.0,    # Computers/TVs left on
        "critical": 8.0,
    },
    "Lighting": {
        "warning": 6.0,    # Lights left on
        "critical": 12.0,
    },
    # Fridge intentionally excluded (expected to run 24/7)
}


# -------------------------------------------------
# Alert Messages
# -------------------------------------------------
def generate_alert_message(device: str, hours: float, severity: str) -> str:
    """Generate user-friendly alert message"""
    
    if severity == "critical":
        return f"🔴 CRITICAL: {device} has been running for {hours:.1f} hours! Check if left on accidentally. High bill risk + potential electrical hazard."
    else:
        return f"⚠️ WARNING: {device} has been on for {hours:.1f} hours. Verify if still needed to prevent wasted energy."


# -------------------------------------------------
# Core Alert Detection Logic
# -------------------------------------------------
def detect_continuous_operation_alerts(csv_path: str = None) -> List[Dict[str, Any]]:
    """
    Analyzes last 3 hours of energy data to detect devices running continuously.
    
    Args:
        csv_path: Optional path to CSV file. If None, uses default energy_usage.csv
    
    Returns list of alert objects with device, duration, severity, and message.
    """
    
    try:
        # Load dataset
        if csv_path:
            # Load from specified test CSV
            df = pd.read_csv(csv_path)
            df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
            df = df.dropna(subset=["timestamp"])
        else:
            # Load default dataset
            df = load_energy_data()
        
        if df.empty:
            return []
        
        # Use dataset's reference time (latest timestamp), not system clock
        reference_time = df["timestamp"].max()
        window_start = reference_time - timedelta(hours=3)
        
        # Filter last 3 hours of data relative to dataset timeline
        df_recent = df[df["timestamp"] >= window_start].copy()
        
        if df_recent.empty:
            return []
        
        alerts = []
        
        # Group by device and analyze total runtime (sum of duration_minutes)
        for device_name, device_df in df_recent.groupby("device_name"):
            # Normalize device name using alias map
            normalized_device = DEVICE_NAME_MAP.get(device_name, device_name)
            # Only show alert for Air Conditioner
            if normalized_device != "Air Conditioner":
                continue
            # Skip devices not in alert threshold config (e.g., Fridge)
            if normalized_device not in ALERT_THRESHOLDS:
                continue

            # Filter for active power draw (device is ON)
            active_records = device_df[device_df["power_watts"] > 0]
            if active_records.empty:
                continue

            # Sum up total runtime in minutes in the window
            total_runtime_minutes = active_records["duration_minutes"].sum()
            duration_hours = total_runtime_minutes / 60.0

            # Check against thresholds
            thresholds = ALERT_THRESHOLDS[normalized_device]
            severity = None
            if duration_hours >= thresholds["critical"]:
                severity = "critical"
            elif duration_hours >= thresholds["warning"]:
                severity = "warning"

            # Generate alert if threshold exceeded
            if severity:
                first_timestamp = active_records["timestamp"].min()
                last_timestamp = active_records["timestamp"].max()
                alert_id = f"{normalized_device}_{first_timestamp.strftime('%Y%m%d%H%M')}"
                alerts.append({
                    "id": alert_id,
                    "device": normalized_device,
                    "duration_hours": round(duration_hours, 1),
                    "severity": severity,
                    "message": generate_alert_message(normalized_device, duration_hours, severity),
                    "first_detected": first_timestamp.isoformat(),
                    "last_seen": last_timestamp.isoformat(),
                    "power_watts": float(active_records["power_watts"].mean()),
                    "estimated_cost": calculate_alert_cost(duration_hours, active_records["power_watts"].mean())
                })
        
        # Sort by severity (critical first) then duration
        alerts.sort(key=lambda x: (0 if x["severity"] == "critical" else 1, -x["duration_hours"]))
        
        return alerts
    
    except Exception as e:
        print(f"[ALERT SERVICE ERROR] {e}")
        return []


# -------------------------------------------------
# Cost Estimation for Alert Context
# -------------------------------------------------
def calculate_alert_cost(hours: float, avg_watts: float) -> float:
    """
    Estimate cost of continuous operation.
    Uses average tariff of $0.12/kWh
    """
    energy_kwh = (avg_watts / 1000) * hours
    cost = energy_kwh * 0.12  # $0.12 per kWh
    return round(cost, 2)


# -------------------------------------------------
# Export Public Interface
# -------------------------------------------------
def get_active_alerts(csv_path: str = None) -> Dict[str, Any]:
    """
    Public API endpoint function.
    Returns alert summary with count and detailed alerts.
    
    Args:
        csv_path: Optional path to CSV file for testing. If None, uses production data.
    """
    alerts = detect_continuous_operation_alerts(csv_path)
    
    return {
        "alert_count": len(alerts),
        "alerts": alerts,
        "last_checked": datetime.now().isoformat(),
        "monitoring_window_hours": 3,
        "dataset": "test" if csv_path else "production"
    }
