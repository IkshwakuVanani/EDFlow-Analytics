from __future__ import annotations

from pydantic import BaseModel


class Measure(BaseModel):
    measure_id: str
    measure_name: str
    measure_group: str
    unit: str
    higher_is_worse: bool
