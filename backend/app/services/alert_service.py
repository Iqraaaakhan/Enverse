"""
Smart Alert Detection Service
Analyzes recent energy data to detect continuous device operation
and generates actionable alerts for user safety and cost prevention.
"""

import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any
from app.services.data_loader import load_energy_data

# Device name aliasing for alert logic
DEVICE_ALIASES = {
    "Residential Cooling (AC)": "Air Conditioner",
}


# -------------------------------------------------
# Device-Specific Alert Thresholds (Hours)
# -------------------------------------------------
ALERT_THRESHOLDS = {
    "Air Conditioner": {
        "warning": 2.0,    # Alert after 2 hours
        "critical": 3.0,   # Critical after 3 hours (matches window)
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
        
        # Group by device and analyze continuous operation
        for device_name, device_df in df_recent.groupby("device_name"):
            # Map device name using aliases if present
            canonical_name = DEVICE_ALIASES.get(device_name, device_name)
            # Skip devices not in alert threshold config (e.g., Fridge)
            if canonical_name not in ALERT_THRESHOLDS:
                continue
            # Sort by timestamp to get continuous operation window
            device_df = device_df.sort_values("timestamp")
            # Filter for active power draw (device is ON)
            active_records = device_df[device_df["power_watts"] > 0]
            if active_records.empty:
                continue
            # Calculate continuous runtime
            first_timestamp = active_records["timestamp"].min()
            last_timestamp = active_records["timestamp"].max()
            # Calculate duration in hours
            duration = (last_timestamp - first_timestamp).total_seconds() / 3600
            # Check against thresholds (use canonical_name)
            thresholds = ALERT_THRESHOLDS[canonical_name]
            severity = None
            if duration >= thresholds["critical"]:
                severity = "critical"
            elif duration >= thresholds["warning"]:
                severity = "warning"
            # Generate alert if threshold exceeded
            if severity:
                alert_id = f"{canonical_name}_{first_timestamp.strftime('%Y%m%d%H%M')}"
                alerts.append({
                    "id": alert_id,
                    "device": canonical_name,
                    "duration_hours": round(duration, 1),
                    "severity": severity,
                    "message": generate_alert_message(canonical_name, duration, severity),
                    "first_detected": first_timestamp.isoformat(),
                    "last_seen": last_timestamp.isoformat(),
                    "power_watts": float(active_records["power_watts"].mean()),
                    "estimated_cost": calculate_alert_cost(duration, active_records["power_watts"].mean())
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
