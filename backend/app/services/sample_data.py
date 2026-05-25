from __future__ import annotations

from statistics import median
from typing import Optional

from sqlalchemy.orm import Session

from app.db import models


MEASURES = [
    {
        "measure_id": "OP_18B",
        "measure_name": "Median time from ED arrival to ED departure for discharged patients",
        "measure_group": "Emergency Department",
        "unit": "minutes",
        "higher_is_worse": True,
    },
    {
        "measure_id": "OP_18C",
        "measure_name": "Median time from ED arrival to ED departure for psychiatric patients",
        "measure_group": "Emergency Department",
        "unit": "minutes",
        "higher_is_worse": True,
    },
    {
        "measure_id": "OP_22",
        "measure_name": "Left without being seen",
        "measure_group": "Emergency Department",
        "unit": "percent",
        "higher_is_worse": True,
    },
    {
        "measure_id": "OP_23",
        "measure_name": "Head CT/MRI results for acute stroke or hemorrhage patients",
        "measure_group": "Emergency Department",
        "unit": "minutes",
        "higher_is_worse": True,
    },
    {
        "measure_id": "EDV",
        "measure_name": "Emergency department volume",
        "measure_group": "Emergency Department",
        "unit": "category",
        "higher_is_worse": False,
    },
]


HOSPITALS = [
    ("010001", "Southeast Health Medical Center", "Dothan", "AL", "36301", "Voluntary nonprofit", 3.0, 158, 312, 2.1, 45),
    ("010005", "Marshall Medical Centers", "Boaz", "AL", "35957", "Government", 4.0, 144, 288, 1.8, 43),
    ("050001", "UCSF Medical Center", "San Francisco", "CA", "94143", "Voluntary nonprofit", 5.0, 256, 420, 4.7, 58),
    ("050002", "Cedars-Sinai Medical Center", "Los Angeles", "CA", "90048", "Voluntary nonprofit", 4.0, 220, 381, 3.8, 51),
    ("060001", "Denver Health Medical Center", "Denver", "CO", "80204", "Government", 3.0, 190, 340, 3.0, 47),
    ("110001", "Grady Memorial Hospital", "Atlanta", "GA", "30303", "Government", 3.0, 278, 450, 5.5, 64),
    ("120001", "The Queen's Medical Center", "Honolulu", "HI", "96813", "Voluntary nonprofit", 4.0, 310, 510, 6.2, 70),
    ("250001", "University of Mississippi Medical Center", "Jackson", "MS", "39216", "Government", 3.0, 246, 408, 4.4, 57),
    ("360001", "Cleveland Clinic", "Cleveland", "OH", "44195", "Voluntary nonprofit", 5.0, 175, 305, 2.4, 42),
    ("390001", "Hospital of the University of Pennsylvania", "Philadelphia", "PA", "19104", "Voluntary nonprofit", 5.0, 230, 390, 3.6, 52),
    ("440001", "Vanderbilt University Medical Center", "Nashville", "TN", "37232", "Voluntary nonprofit", 4.0, 202, 360, 3.4, 49),
    ("490001", "Inova Fairfax Hospital", "Falls Church", "VA", "22042", "Voluntary nonprofit", 4.0, 165, 320, 2.0, 44),
]


REGIONS = {
    "AL": "South",
    "CA": "West",
    "CO": "West",
    "GA": "South",
    "HI": "West",
    "MS": "South",
    "OH": "Midwest",
    "PA": "Northeast",
    "TN": "South",
    "VA": "South",
}


def seed_sample_data(db: Session) -> None:
    if db.query(models.DimHospital).count() > 0:
        return

    for state, region in REGIONS.items():
        db.add(models.DimLocation(state=state, region=region))

    for measure in MEASURES:
        db.add(models.DimMeasure(**measure))

    for provider_id, name, city, state, zip_code, ownership, rating, op18b, op18c, op22, op23 in HOSPITALS:
        db.add(
            models.DimHospital(
                provider_id=provider_id,
                facility_name=name,
                address="Local development seed address",
                city=city,
                state=state,
                zip_code=zip_code,
                county=None,
                telephone=None,
                hospital_type="Acute Care Hospitals",
                ownership=ownership,
                emergency_services=True,
                overall_rating=rating,
            )
        )
        values = {"OP_18B": op18b, "OP_18C": op18c, "OP_22": op22, "OP_23": op23}
        for measure_id, value in values.items():
            db.add(
                models.FactEDQualityMeasure(
                    provider_id=provider_id,
                    measure_id=measure_id,
                    score_raw=str(value),
                    score_value=float(value),
                    sample_raw="Local sample seed",
                    footnote="Seed data for local development until CMS ingest is run",
                    start_date="01/01/2024",
                    end_date="12/31/2024",
                    reporting_period="2024",
                    data_status="reported",
                )
            )
        db.add(
            models.FactEDQualityMeasure(
                provider_id=provider_id,
                measure_id="EDV",
                score_raw="high",
                score_value=None,
                sample_raw="Local sample seed",
                start_date="01/01/2024",
                end_date="12/31/2024",
                reporting_period="2024",
                data_status="reported_non_numeric",
            )
        )

    db.flush()
    _build_state_summaries(db)
    _build_quality_checks(db)
    _build_model_outputs(db)
    db.commit()


def _percentile(values: list[float], percentile: float) -> float:
    ordered = sorted(values)
    if not ordered:
        return 0.0
    index = (len(ordered) - 1) * percentile
    lower = int(index)
    upper = min(lower + 1, len(ordered) - 1)
    weight = index - lower
    return ordered[lower] * (1 - weight) + ordered[upper] * weight


def _build_state_summaries(db: Session) -> None:
    for measure in ["OP_18B", "OP_18C", "OP_22", "OP_23"]:
        for state in sorted(REGIONS):
            values = [
                fact.score_value
                for fact, hospital in db.query(models.FactEDQualityMeasure, models.DimHospital)
                .join(models.DimHospital, models.FactEDQualityMeasure.provider_id == models.DimHospital.provider_id)
                .filter(models.FactEDQualityMeasure.measure_id == measure, models.DimHospital.state == state)
                .all()
                if fact.score_value is not None
            ]
            if not values:
                continue
            db.add(
                models.FactStateEDSummary(
                    state=state,
                    measure_id=measure,
                    hospital_count=len(values),
                    average_score=round(sum(values) / len(values), 2),
                    median_score=round(median(values), 2),
                    p75_score=round(_percentile(values, 0.75), 2),
                    missing_rate=0.0,
                    start_date="01/01/2024",
                    end_date="12/31/2024",
                )
            )


def _build_quality_checks(db: Session) -> None:
    checks = [
        ("raw_row_count", "raw_timely_effective_care", "warning", 0, 1, "Run pipelines/ingest_cms.py to load live CMS rows."),
        ("clean_hospital_count", "dim_hospital", "pass", len(HOSPITALS), 1, "Local seed hospitals are available."),
        ("clean_fact_count", "fact_ed_quality_measure", "pass", len(HOSPITALS) * 5, 1, "ED measure facts are available."),
        ("invalid_numeric_fields", "fact_ed_quality_measure", "pass", 0, 0, "Numeric ED measures parsed successfully in seed data."),
        ("missing_op18b_rate", "fact_ed_quality_measure", "pass", 0, 5, "No OP_18B values are missing in seed data."),
    ]
    for name, table, status, value, threshold, details in checks:
        db.add(
            models.DataQualityCheck(
                check_name=name,
                table_name=table,
                status=status,
                metric_value=float(value),
                threshold=float(threshold),
                details=details,
            )
        )


def _build_model_outputs(db: Session) -> None:
    op18b_rows = [
        (fact, hospital)
        for fact, hospital in db.query(models.FactEDQualityMeasure, models.DimHospital)
        .join(models.DimHospital, models.FactEDQualityMeasure.provider_id == models.DimHospital.provider_id)
        .filter(models.FactEDQualityMeasure.measure_id == "OP_18B")
        .all()
        if fact.score_value is not None
    ]
    values = [row[0].score_value for row in op18b_rows]
    mean_value = sum(values) / len(values)
    std_value = (sum((value - mean_value) ** 2 for value in values) / len(values)) ** 0.5 or 1
    high_risk_cutoff = _percentile(values, 0.75)

    for fact, hospital in op18b_rows:
        z_score = (fact.score_value - mean_value) / std_value
        lwbs = _measure_value(db, hospital.provider_id, "OP_22") or 0
        if z_score > 1 or fact.score_value >= high_risk_cutoff:
            severity = "high" if z_score >= 1.5 or lwbs >= 5 else "moderate"
            db.add(
                models.ModelOutlier(
                    provider_id=hospital.provider_id,
                    facility_name=hospital.facility_name,
                    state=hospital.state,
                    measure_id="OP_18B",
                    score_value=round(fact.score_value, 2),
                    z_score=round(z_score, 2),
                    iqr_score=round(max(fact.score_value - high_risk_cutoff, 0), 2),
                    severity=severity,
                    reason="ED departure time is above the national seed-data upper quartile.",
                )
            )

        cluster_id, label = _cluster_for(fact.score_value, lwbs)
        db.add(
            models.ModelCluster(
                provider_id=hospital.provider_id,
                facility_name=hospital.facility_name,
                state=hospital.state,
                cluster_id=cluster_id,
                cluster_label=label,
                features_json={
                    "ed_departure_minutes": fact.score_value,
                    "left_without_being_seen_rate": lwbs,
                    "overall_rating": hospital.overall_rating,
                },
            )
        )

        probability = min(0.95, max(0.05, 0.2 + (fact.score_value - 150) / 260 + lwbs / 20))
        if probability >= 0.66:
            category = "high"
        elif probability >= 0.45:
            category = "watch"
        else:
            category = "lower"
        db.add(
            models.HighRiskHospital(
                provider_id=hospital.provider_id,
                facility_name=hospital.facility_name,
                state=hospital.state,
                risk_probability=round(probability, 2),
                risk_category=category,
                drivers_json=_risk_drivers(fact.score_value, lwbs, hospital.overall_rating),
            )
        )

    for feature_name, importance in [
        ("OP_18B departure minutes", 0.42),
        ("OP_22 left without being seen rate", 0.31),
        ("OP_18C psychiatric ED time", 0.15),
        ("Overall hospital rating", 0.08),
        ("State-level average", 0.04),
    ]:
        db.add(
            models.FeatureImportance(
                feature_name=feature_name,
                importance=importance,
                model_name="high_ed_delay_logistic_baseline",
            )
        )

    db.add(
        models.ModelRun(
            run_name="local_seed_model_run",
            model_type="zscore_clustering_logistic_baseline",
            metrics_json={
                "baseline_accuracy": 0.75,
                "model_accuracy": 0.83,
                "precision": 0.8,
                "recall": 0.67,
                "f1": 0.73,
                "roc_auc": 0.86,
                "sample_size": len(op18b_rows),
            },
            notes="Local seed model outputs demonstrate the API contract. Run pipelines/build_modeling_dataset.py after CMS ingest for real results.",
        )
    )


def _measure_value(db: Session, provider_id: str, measure_id: str) -> Optional[float]:
    fact = (
        db.query(models.FactEDQualityMeasure)
        .filter(
            models.FactEDQualityMeasure.provider_id == provider_id,
            models.FactEDQualityMeasure.measure_id == measure_id,
        )
        .first()
    )
    return fact.score_value if fact else None


def _cluster_for(ed_minutes: float, lwbs_rate: float) -> tuple[int, str]:
    if ed_minutes >= 245 or lwbs_rate >= 5:
        return 3, "High-risk ED bottleneck hospitals"
    if ed_minutes >= 205:
        return 2, "High-delay hospitals"
    if ed_minutes <= 170 and lwbs_rate <= 2.5:
        return 0, "High-performing hospitals"
    return 1, "Average throughput hospitals"


def _risk_drivers(ed_minutes: float, lwbs_rate: float, rating: Optional[float]) -> list[str]:
    drivers = []
    if ed_minutes >= 220:
        drivers.append("High ED departure time")
    if lwbs_rate >= 4:
        drivers.append("Elevated left-without-being-seen rate")
    if rating is not None and rating <= 3:
        drivers.append("Lower overall hospital rating")
    return drivers or ["No major elevated driver in seed data"]
