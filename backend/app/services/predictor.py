import pandas as pd
from pathlib import Path

# ✅ ENGINEERING HEURISTICS (Duty Cycles)
# Represents the % of time a device draws full rated power during operation.
DUTY_CYCLES = {
    "Residential Cooling (AC)": 0.75,   # Compressor cycles
    "Refrigerator": 0.35,               # Thermostat cycles
    "Washing Machine": 0.40,            # Motor varies
    "Consumer Electronics": 0.95,       # Mostly constant
    "Indoor Lighting Load": 1.00,       # Constant load
    "Unknown": 1.00
}

class EnergyPredictor:
    def predict_energy(self, power_watts: float, duration_minutes: int, appliance: str, mode: str = "system") -> dict:
        """
        Calculates energy impact using Physics + Duty Cycle Heuristics.
        This is deterministic and explainable.
        """
        # 1. Input Sanitization
        power_watts = float(power_watts) if power_watts else 0.0
        duration_minutes = float(duration_minutes) if duration_minutes else 0.0

        if power_watts <= 0 or duration_minutes <= 0:
            return {"energy_kwh": 0.0, "method": "input_validation", "reason": "Zero input"}

        # 2. Apply Duty Cycle
        # Match appliance string to heuristic map
        duty_cycle = 1.0
        for key, val in DUTY_CYCLES.items():
            if key in appliance or appliance in key:
                duty_cycle = val
                break

        # 3. Physics Calculation
        # Formula: (Watts * DutyCycle / 1000) * (Minutes / 60)
        effective_power = power_watts * duty_cycle
        physics_kwh = (effective_power / 1000) * (duration_minutes / 60)
        
        return {
            "energy_kwh": round(physics_kwh, 4),
            "method": "physics_duty_cycle",
            "reason": f"Applied {int(duty_cycle*100)}% duty cycle for {appliance}",
            "mode": mode
        }