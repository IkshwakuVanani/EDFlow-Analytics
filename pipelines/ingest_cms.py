from __future__ import annotations

import argparse
import os
from pathlib import Path

import pandas as pd
import requests

from common import CMS_PROVIDER_DATA_API, DEFAULT_TIMELY_EFFECTIVE_CARE_DATASET, ED_MEASURE_IDS, RAW_DIR


def fetch_cms_rows(dataset: str, limit: int, max_rows: int | None, ed_only: bool) -> list[dict]:
    rows: list[dict] = []
    offset = 0
    total_count: int | None = None
    while True:
        response = requests.get(
            f"{CMS_PROVIDER_DATA_API}/{dataset}/0",
            params={
                "offset": offset,
                "limit": limit,
                "results": "true",
                "count": "true",
                "rowIds": "false",
            },
            timeout=60,
        )
        response.raise_for_status()
        payload = response.json()
        batch = payload.get("results", [])
        total_count = payload.get("count", total_count)
        if ed_only:
            batch = [
                row
                for row in batch
                if str(row.get("measure_id", "")).upper() in ED_MEASURE_IDS
                or str(row.get("_condition", "")).lower() == "emergency department"
            ]
        rows.extend(batch)
        offset += payload.get("query", {}).get("limit", limit)

        if not payload.get("results") or (total_count is not None and offset >= total_count):
            break
        if max_rows is not None and len(rows) >= max_rows:
            rows = rows[:max_rows]
            break
    return rows


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest CMS Timely and Effective Care hospital data.")
    parser.add_argument("--dataset", default=os.getenv("CMS_TIMELY_EFFECTIVE_CARE_DATASET", DEFAULT_TIMELY_EFFECTIVE_CARE_DATASET))
    parser.add_argument("--limit", type=int, default=1500)
    parser.add_argument("--max-rows", type=int, default=15000, help="Maximum rows after optional ED filtering. Use 0 for all rows.")
    parser.add_argument("--output", default=str(RAW_DIR / "timely_effective_care.csv"))
    parser.add_argument("--ed-only", action="store_true", help="Keep ED-related rows only.")
    args = parser.parse_args()

    max_rows = None if args.max_rows == 0 else args.max_rows
    rows = fetch_cms_rows(args.dataset, args.limit, max_rows, args.ed_only)
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    pd.DataFrame(rows).to_csv(output, index=False)
    print(f"Wrote {len(rows)} rows to {output}")


if __name__ == "__main__":
    main()
