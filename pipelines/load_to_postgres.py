from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

import pandas as pd
from sqlalchemy import create_engine

sys.path.append(str(Path(__file__).resolve().parents[1] / "backend"))

from app.db.database import Base  # noqa: E402
from app.db import models  # noqa: F401,E402
from common import PROCESSED_DIR, RAW_DIR


TABLE_FILES = {
    "raw_timely_effective_care": RAW_DIR / "timely_effective_care.csv",
    "dim_hospital": PROCESSED_DIR / "dim_hospital.csv",
    "dim_measure": PROCESSED_DIR / "dim_measure.csv",
    "fact_ed_quality_measure": PROCESSED_DIR / "fact_ed_quality_measure.csv",
    "fact_state_ed_summary": PROCESSED_DIR / "fact_state_ed_summary.csv",
}


def main() -> None:
    parser = argparse.ArgumentParser(description="Load processed EDFlow CSV tables into PostgreSQL.")
    parser.add_argument("--database-url", default=os.getenv("DATABASE_URL"))
    parser.add_argument("--if-exists", choices=["replace", "append"], default="replace")
    args = parser.parse_args()
    if not args.database_url:
        raise SystemExit("DATABASE_URL is required")

    engine = create_engine(args.database_url, future=True)
    Base.metadata.create_all(bind=engine)
    for table, path in TABLE_FILES.items():
        if not path.exists():
            print(f"Skipping {table}; missing {path}")
            continue
        frame = pd.read_csv(path)
        if table == "raw_timely_effective_care" and "_condition" in frame.columns:
            frame = frame.rename(columns={"_condition": "condition"})
        frame.to_sql(table, engine, if_exists=args.if_exists, index=False)
        print(f"Loaded {len(frame)} rows into {table}")


if __name__ == "__main__":
    main()
