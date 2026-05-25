from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.services import hospital_service

router = APIRouter(tags=["hospitals"])


@router.get("/hospitals")
def list_hospitals(
    search: Optional[str] = None,
    state: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> dict:
    return hospital_service.list_hospitals(db, search=search, state=state, limit=limit, offset=offset)


@router.get("/hospitals/{provider_id}")
def get_hospital(provider_id: str, db: Session = Depends(get_db)) -> dict:
    hospital = hospital_service.get_hospital(db, provider_id)
    if hospital is None:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return hospital


@router.get("/measures")
def list_measures(db: Session = Depends(get_db)) -> list[dict]:
    return hospital_service.list_measures(db)
