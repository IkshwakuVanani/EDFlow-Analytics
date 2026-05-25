from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.services import ed_service

router = APIRouter(prefix="/ed", tags=["ed analytics"])


@router.get("/overview")
def overview(db: Session = Depends(get_db)) -> dict:
    return ed_service.get_overview(db)


@router.get("/state-summary")
def state_summary(measure_id: str = "OP_18B", db: Session = Depends(get_db)) -> list[dict]:
    return ed_service.get_state_summary(db, measure_id=measure_id)


@router.get("/outliers")
def outliers(
    measure_id: str = "OP_18B",
    limit: int = Query(default=25, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[dict]:
    return ed_service.get_outliers(db, measure_id=measure_id, limit=limit)


@router.get("/hospital-comparison")
def hospital_comparison(
    provider_ids: Optional[List[str]] = Query(default=None),
    db: Session = Depends(get_db),
) -> list[dict]:
    return ed_service.get_hospital_comparison(db, provider_ids=provider_ids)
