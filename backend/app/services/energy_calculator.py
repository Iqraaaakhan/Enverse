from typing import List, Dict


def calculate_energy_kwh(records: List[Dict]) -> List[Dict]:
    """
    Adds energy_kwh field to each record.
    Formula:
    energy (kWh) = (power_watts × duration_minutes) / (1000 × 60)
    """
    enriched = []

    for row in records:
        power_watts = float(row["power_watts"])
        duration_minutes = float(row["duration_minutes"])

        energy_kwh = (power_watts * duration_minutes) / (1000 * 60)

        new_row = row.copy()
        new_row["energy_kwh"] = round(energy_kwh, 4)

        enriched.append(new_row)

    return enriched
