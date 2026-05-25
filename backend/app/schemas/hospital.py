from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


class HospitalSummary(BaseModel):
    provider_id: str
    facility_name: str
    city: Optional[str] = None
    state: str
    overall_rating: Optional[float] = None
    ed_departure_minutes: Optional[float] = None
    left_without_seen_rate: Optional[float] = None


class HospitalDetail(HospitalSummary):
    address: Optional[str] = None
    zip_code: Optional[str] = None
    county: Optional[str] = None
    telephone: Optional[str] = None
    hospital_type: Optional[str] = None
    ownership: Optional[str] = None
    measures: list[dict]
