from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.services import modeling_service

router = APIRouter(prefix="/models", tags=["modeling"])


@router.get("/outliers")
def model_outliers(limit: int = Query(default=25, ge=1, le=100), db: Session = Depends(get_db)) -> list[dict]:
    return modeling_service.get_model_outliers(db, limit=limit)


@router.get("/clusters")
def clusters(db: Session = Depends(get_db)) -> dict:
    return modeling_service.get_clusters(db)


@router.get("/high-risk-hospitals")
def high_risk_hospitals(
    limit: int = Query(default=25, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[dict]:
    return modeling_service.get_high_risk_hospitals(db, limit=limit)


@router.get("/feature-importance")
def feature_importance(db: Session = Depends(get_db)) -> list[dict]:
    return modeling_service.get_feature_importance(db)


@router.get("/model-summary")
def model_summary(db: Session = Depends(get_db)) -> dict:
    return modeling_service.get_model_summary(db)
