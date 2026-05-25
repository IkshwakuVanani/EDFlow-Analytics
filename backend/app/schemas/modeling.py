from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


class ModelOutlierResponse(BaseModel):
    provider_id: str
    facility_name: str
    state: str
    measure_id: str
    score_value: float
    z_score: Optional[float] = None
    severity: str
    reason: str


class HighRiskHospitalResponse(BaseModel):
    provider_id: str
    facility_name: str
    state: str
    risk_probability: float
    risk_category: str
    drivers: list[str]
