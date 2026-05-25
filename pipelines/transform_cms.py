from __future__ import annotations

import argparse
from pathlib import Path

import pandas as pd

from common import ED_MEASURE_IDS, PROCESSED_DIR, RAW_DIR, measure_unit, normalize_state, parse_numeric_score, reporting_period


def transform(raw_path: Path, output_dir: Path) -> dict[str, pd.DataFrame]:
    raw = pd.read_csv(raw_path, dtype=str).fillna("")
    if "_condition" in raw.columns:
        raw = raw.rename(columns={"_condition": "condition"})
    raw["measure_id"] = raw["measure_id"].str.strip().str.upper()

    ed = raw[
        raw["measure_id"].isin(ED_MEASURE_IDS)
        | raw.get("condition", pd.Series("", index=raw.index)).str.lower().eq("emergency department")
    ].copy()
    ed["provider_id"] = ed["facility_id"].str.strip()
    ed["state"] = ed["state"].map(normalize_state)
    ed["score_value"] = ed["score"].map(parse_numeric_score)
    ed["reporting_period"] = ed["end_date"].map(reporting_period)

    dim_hospital = (
        ed[
            [
                "provider_id",
                "facility_name",
                "address",
                "citytown",
                "state",
                "zip_code",
                "countyparish",
                "telephone_number",
            ]
        ]
        .drop_duplicates("provider_id")
        .rename(
            columns={
                "citytown": "city",
                "countyparish": "county",
                "telephone_number": "telephone",
            }
        )
    )
    dim_hospital["hospital_type"] = None
    dim_hospital["ownership"] = None
    dim_hospital["emergency_services"] = True
    dim_hospital["overall_rating"] = None

    dim_measure = (
        ed[["measure_id", "measure_name"]]
        .drop_duplicates("measure_id")
        .assign(
            measure_group="Emergency Department",
            unit=lambda frame: frame["measure_id"].map(measure_unit),
            higher_is_worse=lambda frame: frame["measure_id"].ne("EDV"),
        )
    )

    fact = ed[
        [
            "provider_id",
            "measure_id",
            "score",
            "score_value",
            "sample",
            "footnote",
            "start_date",
            "end_date",
            "reporting_period",
        ]
    ].rename(columns={"score": "score_raw", "sample": "sample_raw"})
    fact["data_status"] = fact["score_value"].isna().map(lambda missing: "missing_or_non_numeric" if missing else "reported")

    state_summary = (
        fact.dropna(subset=["score_value"])
        .merge(dim_hospital[["provider_id", "state"]], on="provider_id", how="left")
        .groupby(["state", "measure_id"])
        .agg(
            hospital_count=("provider_id", "nunique"),
            average_score=("score_value", "mean"),
            median_score=("score_value", "median"),
            p75_score=("score_value", lambda series: series.quantile(0.75)),
            start_date=("start_date", "min"),
            end_date=("end_date", "max"),
        )
        .reset_index()
    )
    state_summary["missing_rate"] = 0.0
    for column in ["average_score", "median_score", "p75_score"]:
        state_summary[column] = state_summary[column].round(2)

    output_dir.mkdir(parents=True, exist_ok=True)
    outputs = {
        "dim_hospital": dim_hospital,
        "dim_measure": dim_measure,
        "fact_ed_quality_measure": fact,
        "fact_state_ed_summary": state_summary,
    }
    for name, frame in outputs.items():
        frame.to_csv(output_dir / f"{name}.csv", index=False)
    return outputs


def main() -> None:
    parser = argparse.ArgumentParser(description="Transform raw CMS rows into analytics-ready EDFlow tables.")
    parser.add_argument("--raw", default=str(RAW_DIR / "timely_effective_care.csv"))
    parser.add_argument("--output-dir", default=str(PROCESSED_DIR))
    args = parser.parse_args()
    outputs = transform(Path(args.raw), Path(args.output_dir))
    for name, frame in outputs.items():
        print(f"{name}: {len(frame)} rows")


if __name__ == "__main__":
    main()
