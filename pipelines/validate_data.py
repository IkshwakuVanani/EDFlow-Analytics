from __future__ import annotations

import argparse
import json
from pathlib import Path

import pandas as pd

from common import PROCESSED_DIR, RAW_DIR


def validate(raw_path: Path, processed_dir: Path) -> dict:
    checks: list[dict] = []
    raw_count = len(pd.read_csv(raw_path, dtype=str)) if raw_path.exists() else 0
    checks.append(_check("raw_row_count", "raw_timely_effective_care", raw_count > 0, raw_count, 1))

    fact_path = processed_dir / "fact_ed_quality_measure.csv"
    hospital_path = processed_dir / "dim_hospital.csv"
    measure_path = processed_dir / "dim_measure.csv"
    fact = pd.read_csv(fact_path) if fact_path.exists() else pd.DataFrame()
    hospitals = pd.read_csv(hospital_path) if hospital_path.exists() else pd.DataFrame()
    measures = pd.read_csv(measure_path) if measure_path.exists() else pd.DataFrame()

    checks.append(_check("clean_hospital_count", "dim_hospital", len(hospitals) > 0, len(hospitals), 1))
    checks.append(_check("measure_count", "dim_measure", len(measures) > 0, len(measures), 1))
    checks.append(_check("clean_fact_count", "fact_ed_quality_measure", len(fact) > 0, len(fact), 1))

    if not fact.empty:
        numeric_missing_rate = float(fact["score_value"].isna().mean() * 100)
        op18b = fact[fact["measure_id"] == "OP_18B"]
        op18b_missing = float(op18b["score_value"].isna().mean() * 100) if not op18b.empty else 100.0
        checks.append(_check("invalid_numeric_fields_pct", "fact_ed_quality_measure", numeric_missing_rate <= 60, numeric_missing_rate, 60))
        checks.append(_check("missing_op18b_pct", "fact_ed_quality_measure", op18b_missing <= 40, op18b_missing, 40))

    return {
        "raw_row_count": raw_count,
        "clean_hospital_count": int(len(hospitals)),
        "clean_fact_count": int(len(fact)),
        "checks": checks,
    }


def _check(name: str, table: str, passed: bool, value: float, threshold: float) -> dict:
    return {
        "check_name": name,
        "table_name": table,
        "status": "pass" if passed else "fail",
        "metric_value": round(float(value), 2),
        "threshold": float(threshold),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate EDFlow raw and processed datasets.")
    parser.add_argument("--raw", default=str(RAW_DIR / "timely_effective_care.csv"))
    parser.add_argument("--processed-dir", default=str(PROCESSED_DIR))
    parser.add_argument("--output", default=str(PROCESSED_DIR / "data_quality_report.json"))
    args = parser.parse_args()

    report = validate(Path(args.raw), Path(args.processed_dir))
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
