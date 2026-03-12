"""
Shared utilities for PUL Stats Hub processing scripts.
"""

import json
from pathlib import Path
from typing import Any


# Canonical team abbreviation → full name mapping
TEAM_NAMES: dict[str, str] = {
    "ATL": "Atlanta Soul",
    "ATX": "Austin Torch",
    "DC": "DC Shadow",
    "IND": "Indy Red",
    "INDY": "Indy Red",
    "LA": "LA Astra",
    "MKE": "Milwaukee Monarchs",
    "MIN": "Minnesota Strike",
    "MINN": "Minnesota Strike",
    "NSH": "Nashville NightShade",
    "NASH": "Nashville NightShade",
    "NY": "New York Gridlock",
    "PHL": "Philadelphia Surge",
    "PORT": "Portland Rising",
    "RAL": "Raleigh Radiance",
}


def safe_int(value: Any, default: int = 0) -> int:
    """Convert value to int, returning default for None, empty, or non-numeric values."""
    try:
        return int(value or default)
    except (ValueError, TypeError):
        return default


def load_json(path: Path) -> list[dict[str, Any]]:
    """Load a JSON file, returning an empty list if the file does not exist."""
    if path.exists():
        with open(path) as f:
            return json.load(f)
    return []


def save_json(data: list[dict[str, Any]], path: Path) -> None:
    """Write data to a JSON file and print a confirmation message."""
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"  Saved {len(data)} records to {path}")
