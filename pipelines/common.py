from __future__ import annotations

import re
from pathlib import Path


CMS_PROVIDER_DATA_API = "https://data.cms.gov/provider-data/api/1/datastore/query"
DEFAULT_TIMELY_EFFECTIVE_CARE_DATASET = "yv7e-xc69"
ED_MEASURE_IDS = {"OP_18B", "OP_18C", "OP_22", "OP_23", "EDV"}
RAW_DIR = Path("data/raw")
PROCESSED_DIR = Path("data/processed")


def parse_numeric_score(value: object) -> float | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text or text.lower() in {"not available", "not applicable", "nan", "none"}:
        return None
    match = re.search(r"-?\d+(?:\.\d+)?", text.replace(",", ""))
    return float(match.group(0)) if match else None


def normalize_state(value: object) -> str | None:
    if value is None:
        return None
    text = str(value).strip().upper()
    return text if len(text) == 2 else None


def measure_unit(measure_id: str) -> str:
    if measure_id == "OP_22":
        return "percent"
    if measure_id == "EDV":
        return "category"
    return "minutes"


def reporting_period(end_date: object) -> str | None:
    if end_date is None:
        return None
    text = str(end_date).strip()
    return text[-4:] if len(text) >= 4 else None
