from __future__ import annotations

from statistics import median
from typing import List, Optional

from sqlalchemy.orm import Session

from app.db import models


def get_overview(db: Session) -> dict:
    op18b = _measure_rows(db, "OP_18B")
    lwbs = _measure_rows(db, "OP_22")
    values = [row["score_value"] for row in op18b]
    state_summary = get_state_summary(db, "OP_18B")
    sorted_states = sorted(
        state_summary,
        key=lambda row: row["average_score"] if row["average_score"] is not None else 999999,
    )

    return {
        "national_median_ed_time": round(median(values), 1) if values else None,
        "reporting_hospitals": len({row["provider_id"] for row in op18b}),
        "average_lwbs_rate": round(sum(row["score_value"] for row in lwbs) / len(lwbs), 2) if lwbs else None,
        "best_state": sorted_states[0] if sorted_states else None,
        "worst_state": sorted_states[-1] if sorted_states else None,
        "distribution": _distribution(values),
        "state_summary": sorted_states,
    }


def get_state_summary(db: Session, measure_id: str = "OP_18B") -> list[dict]:
    summaries = (
        db.query(models.FactStateEDSummary)
        .filter(models.FactStateEDSummary.measure_id == measure_id)
        .order_by(models.FactStateEDSummary.average_score.desc())
        .all()
    )
    return [
        {
            "state": row.state,
            "measure_id": row.measure_id,
            "hospital_count": row.hospital_count,
            "average_score": row.average_score,
            "median_score": row.median_score,
            "p75_score": row.p75_score,
            "missing_rate": row.missing_rate,
            "start_date": row.start_date,
            "end_date": row.end_date,
        }
        for row in summaries
    ]


def get_outliers(db: Session, measure_id: str = "OP_18B", limit: int = 25) -> list[dict]:
    model_rows = (
        db.query(models.ModelOutlier)
        .filter(models.ModelOutlier.measure_id == measure_id)
        .order_by(models.ModelOutlier.score_value.desc())
        .limit(limit)
        .all()
    )
    if model_rows:
        return [
            {
                "provider_id": row.provider_id,
                "facility_name": row.facility_name,
                "state": row.state,
                "measure_id": row.measure_id,
                "score_value": row.score_value,
                "z_score": row.z_score,
                "iqr_score": row.iqr_score,
                "severity": row.severity,
                "reason": row.reason,
            }
            for row in model_rows
        ]

    rows = _measure_rows(db, measure_id)
    values = [row["score_value"] for row in rows]
    if not values:
        return []
    mean_value = sum(values) / len(values)
    std_value = (sum((value - mean_value) ** 2 for value in values) / len(values)) ** 0.5 or 1
    for row in rows:
        row["z_score"] = round((row["score_value"] - mean_value) / std_value, 2)
        row["severity"] = "high" if row["z_score"] >= 1.5 else "moderate"
        row["reason"] = "Computed z-score outlier from available fact table values."
    return sorted(rows, key=lambda row: row["z_score"], reverse=True)[:limit]


def get_hospital_comparison(db: Session, provider_ids: Optional[List[str]] = None) -> list[dict]:
    query = db.query(models.DimHospital).order_by(models.DimHospital.facility_name)
    if provider_ids:
        query = query.filter(models.DimHospital.provider_id.in_(provider_ids))
    hospitals = query.limit(10).all()
    return [
        {
            "provider_id": hospital.provider_id,
            "facility_name": hospital.facility_name,
            "state": hospital.state,
            "overall_rating": hospital.overall_rating,
            "measures": {
                "OP_18B": _single_measure(db, hospital.provider_id, "OP_18B"),
                "OP_18C": _single_measure(db, hospital.provider_id, "OP_18C"),
                "OP_22": _single_measure(db, hospital.provider_id, "OP_22"),
                "OP_23": _single_measure(db, hospital.provider_id, "OP_23"),
            },
        }
        for hospital in hospitals
    ]


def get_data_quality(db: Session) -> dict:
    checks = (
        db.query(models.DataQualityCheck)
        .order_by(models.DataQualityCheck.checked_at.desc(), models.DataQualityCheck.id.desc())
        .limit(50)
        .all()
    )
    raw_rows = db.query(models.RawTimelyEffectiveCare).count()
    clean_hospitals = db.query(models.DimHospital).count()
    clean_facts = db.query(models.FactEDQualityMeasure).count()
    failed = sum(1 for check in checks if check.status == "fail")
    warnings = sum(1 for check in checks if check.status == "warning")
    return {
        "raw_row_count": raw_rows,
        "clean_hospital_count": clean_hospitals,
        "clean_fact_count": clean_facts,
        "failed_checks": failed,
        "warning_checks": warnings,
        "latest_ingestion_timestamp": checks[0].checked_at.isoformat() if checks else None,
        "checks": [
            {
                "check_name": check.check_name,
                "table_name": check.table_name,
                "status": check.status,
                "metric_value": check.metric_value,
                "threshold": check.threshold,
                "details": check.details,
                "checked_at": check.checked_at.isoformat() if check.checked_at else None,
            }
            for check in checks
        ],
    }


def _measure_rows(db: Session, measure_id: str) -> list[dict]:
    rows = (
        db.query(models.FactEDQualityMeasure, models.DimHospital)
        .join(models.DimHospital, models.FactEDQualityMeasure.provider_id == models.DimHospital.provider_id)
        .filter(
            models.FactEDQualityMeasure.measure_id == measure_id,
            models.FactEDQualityMeasure.score_value.isnot(None),
        )
        .all()
    )
    return [
        {
            "provider_id": hospital.provider_id,
            "facility_name": hospital.facility_name,
            "state": hospital.state,
            "measure_id": fact.measure_id,
            "score_value": round(fact.score_value, 2),
        }
        for fact, hospital in rows
    ]


def _single_measure(db: Session, provider_id: str, measure_id: str) -> Optional[float]:
    fact = (
        db.query(models.FactEDQualityMeasure)
        .filter(
            models.FactEDQualityMeasure.provider_id == provider_id,
            models.FactEDQualityMeasure.measure_id == measure_id,
        )
        .first()
    )
    return round(fact.score_value, 2) if fact and fact.score_value is not None else None


def _distribution(values: list[float]) -> list[dict]:
    buckets = [
        ("<160", lambda value: value < 160),
        ("160-199", lambda value: 160 <= value < 200),
        ("200-239", lambda value: 200 <= value < 240),
        ("240-279", lambda value: 240 <= value < 280),
        ("280+", lambda value: value >= 280),
    ]
    return [{"bucket": label, "count": sum(1 for value in values if predicate(value))} for label, predicate in buckets]
