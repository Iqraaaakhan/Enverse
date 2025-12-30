class EnergyPredictor:
    def predict(self, power_watts: float, duration_minutes: float) -> float:
        """
        Predict energy consumption in kWh using real physics.
        """
        if power_watts < 0 or duration_minutes < 0:
            raise ValueError("Power and duration must be non-negative")

        energy_kwh = (power_watts * duration_minutes) / (1000 * 60)

        return round(energy_kwh, 4)
