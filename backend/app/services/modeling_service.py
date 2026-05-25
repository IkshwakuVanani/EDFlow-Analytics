from __future__ import annotations

from sqlalchemy.orm import Session

from app.db import models


def get_model_outliers(db: Session, limit: int = 25) -> list[dict]:
    rows = db.query(models.ModelOutlier).order_by(models.ModelOutlier.score_value.desc()).limit(limit).all()
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
        for row in rows
    ]


def get_clusters(db: Session) -> dict:
    rows = db.query(models.ModelCluster).order_by(models.ModelCluster.cluster_id, models.ModelCluster.facility_name).all()
    items = [
        {
            "provider_id": row.provider_id,
            "facility_name": row.facility_name,
            "state": row.state,
            "cluster_id": row.cluster_id,
            "cluster_label": row.cluster_label,
            "features": row.features_json,
        }
        for row in rows
    ]
    summary: dict[str, dict] = {}
    for item in items:
        key = item["cluster_label"]
        summary.setdefault(key, {"cluster_label": key, "count": 0, "states": set()})
        summary[key]["count"] += 1
        summary[key]["states"].add(item["state"])
    return {
        "items": items,
        "summary": [
            {"cluster_label": row["cluster_label"], "count": row["count"], "states": sorted(row["states"])}
            for row in summary.values()
        ],
    }


def get_high_risk_hospitals(db: Session, limit: int = 25) -> list[dict]:
    rows = (
        db.query(models.HighRiskHospital)
        .order_by(models.HighRiskHospital.risk_probability.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "provider_id": row.provider_id,
            "facility_name": row.facility_name,
            "state": row.state,
            "risk_probability": row.risk_probability,
            "risk_category": row.risk_category,
            "drivers": row.drivers_json,
        }
        for row in rows
    ]


def get_feature_importance(db: Session) -> list[dict]:
    rows = db.query(models.FeatureImportance).order_by(models.FeatureImportance.importance.desc()).all()
    return [
        {
            "feature_name": row.feature_name,
            "importance": row.importance,
            "model_name": row.model_name,
        }
        for row in rows
    ]


def get_model_summary(db: Session) -> dict:
    run = db.query(models.ModelRun).order_by(models.ModelRun.created_at.desc()).first()
    if run is None:
        return {
            "run_name": None,
            "model_type": None,
            "metrics": {},
            "limitations": _limitations(),
            "warning": _warning(),
        }
    return {
        "run_name": run.run_name,
        "model_type": run.model_type,
        "metrics": run.metrics_json,
        "notes": run.notes,
        "limitations": _limitations(),
        "warning": _warning(),
    }


def _warning() -> str:
    return "This model is for healthcare operations analysis only. It does not make clinical decisions or patient-level predictions."


def _limitations() -> list[str]:
    return [
        "Uses hospital-level public quality data, not patient-level clinical records.",
        "Seed results are illustrative until the CMS ingestion and modeling pipelines are run.",
        "Model outputs should guide analyst review, not operational decisions by themselves.",
        "Missingness, reporting lag, and measure definitions can affect comparability.",
    ]
