from __future__ import annotations

from typing import Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.db import models


def list_hospitals(
    db: Session,
    search: Optional[str] = None,
    state: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> dict:
    query = db.query(models.DimHospital)
    if search:
        like = f"%{search.strip()}%"
        query = query.filter(
            or_(
                models.DimHospital.facility_name.ilike(like),
                models.DimHospital.provider_id.ilike(like),
                models.DimHospital.city.ilike(like),
            )
        )
    if state:
        query = query.filter(models.DimHospital.state == state.upper())

    total = query.count()
    hospitals = query.order_by(models.DimHospital.facility_name).offset(offset).limit(limit).all()
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "items": [_hospital_summary(db, hospital) for hospital in hospitals],
    }


def get_hospital(db: Session, provider_id: str) -> Optional[dict]:
    hospital = db.get(models.DimHospital, provider_id)
    if hospital is None:
        return None

    measures = (
        db.query(models.FactEDQualityMeasure, models.DimMeasure)
        .join(models.DimMeasure, models.FactEDQualityMeasure.measure_id == models.DimMeasure.measure_id)
        .filter(models.FactEDQualityMeasure.provider_id == provider_id)
        .order_by(models.FactEDQualityMeasure.measure_id)
        .all()
    )
    detail = _hospital_summary(db, hospital)
    detail.update(
        {
            "address": hospital.address,
            "zip_code": hospital.zip_code,
            "county": hospital.county,
            "telephone": hospital.telephone,
            "hospital_type": hospital.hospital_type,
            "ownership": hospital.ownership,
            "emergency_services": hospital.emergency_services,
            "measures": [
                {
                    "measure_id": fact.measure_id,
                    "measure_name": measure.measure_name,
                    "score_raw": fact.score_raw,
                    "score_value": fact.score_value,
                    "unit": measure.unit,
                    "start_date": fact.start_date,
                    "end_date": fact.end_date,
                    "data_status": fact.data_status,
                }
                for fact, measure in measures
            ],
        }
    )
    return detail


def list_measures(db: Session) -> list[dict]:
    return [
        {
            "measure_id": measure.measure_id,
            "measure_name": measure.measure_name,
            "measure_group": measure.measure_group,
            "unit": measure.unit,
            "higher_is_worse": measure.higher_is_worse,
        }
        for measure in db.query(models.DimMeasure).order_by(models.DimMeasure.measure_id).all()
    ]


def _hospital_summary(db: Session, hospital: models.DimHospital) -> dict:
    return {
        "provider_id": hospital.provider_id,
        "facility_name": hospital.facility_name,
        "city": hospital.city,
        "state": hospital.state,
        "overall_rating": hospital.overall_rating,
        "ed_departure_minutes": _measure_value(db, hospital.provider_id, "OP_18B"),
        "left_without_seen_rate": _measure_value(db, hospital.provider_id, "OP_22"),
    }


def _measure_value(db: Session, provider_id: str, measure_id: str) -> Optional[float]:
    fact = (
        db.query(models.FactEDQualityMeasure)
        .filter(
            models.FactEDQualityMeasure.provider_id == provider_id,
            models.FactEDQualityMeasure.measure_id == measure_id,
        )
        .order_by(models.FactEDQualityMeasure.end_date.desc())
        .first()
    )
    return round(fact.score_value, 2) if fact and fact.score_value is not None else None
