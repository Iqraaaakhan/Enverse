# backend/app/services/billing_service.py

def calculate_electricity_bill(units_kwh: float) -> dict:
    """
    Calculates electricity bill using Indian domestic slab system.
    Slabs are approximate and exam-friendly.
    """

    bill = 0.0
    remaining_units = units_kwh

    # Slab 1: 0–100 units → ₹3/unit
    if remaining_units > 0:
        slab_units = min(remaining_units, 100)
        bill += slab_units * 3
        remaining_units -= slab_units

    # Slab 2: 101–200 units → ₹5/unit
    if remaining_units > 0:
        slab_units = min(remaining_units, 100)
        bill += slab_units * 5
        remaining_units -= slab_units

    # Slab 3: Above 200 units → ₹8/unit
    if remaining_units > 0:
        bill += remaining_units * 8

    return {
        "monthly_units_kwh": round(units_kwh, 2),
        "estimated_bill_rupees": round(bill, 2),
        "currency": "INR",
    }
