import csv
from pathlib import Path
from typing import List, Dict

# Resolve path to data file safely (industry practice)
DATA_FILE_PATH = Path(__file__).resolve().parents[2] / "data" / "energy_usage.csv"


def load_energy_data() -> List[Dict]:
    """
    Loads energy usage data from CSV file.

    Returns:
        List of records where each record is a dictionary.
    """
    records = []

    with open(DATA_FILE_PATH, newline="", encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            records.append(row)

    return records
