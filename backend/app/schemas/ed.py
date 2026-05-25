from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


class StateSummary(BaseModel):
    state: str
    measure_id: str
    hospital_count: int
    average_score: Optional[float] = None
    median_score: Optional[float] = None
    p75_score: Optional[float] = None
    missing_rate: float = 0


class Overview(BaseModel):
    national_median_ed_time: Optional[float]
    reporting_hospitals: int
    average_lwbs_rate: Optional[float]
    best_state: Optional[dict]
    worst_state: Optional[dict]
    distribution: list[dict]
    state_summary: list[dict]
