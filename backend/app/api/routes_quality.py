from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.services import ed_service

router = APIRouter(tags=["data quality"])


@router.get("/data-quality")
def data_quality(db: Session = Depends(get_db)) -> dict:
    return ed_service.get_data_quality(db)
