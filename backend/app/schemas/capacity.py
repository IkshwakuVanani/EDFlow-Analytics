from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class CapacityKpi(BaseModel):
    id: str
    label: str
    value: str
    severity: str
    trend: str
    detail: str


class CapacityTimelinePoint(BaseModel):
    time: str
    time_label: str
    boarders: int
    predicted_boarders: int
    available_beds: int
    unlockable_beds: int
    risk_window: bool = False
    action_marker: Optional[str] = None


class CapacityFlowNode(BaseModel):
    id: str
    label: str
    value: int
    severity: str
    category: str


class CapacityFlowEdge(BaseModel):
    source: str
    target: str
    label: str
    count: int
    severity: str


class CapacityBlocker(BaseModel):
    id: str
    rank: int
    blocker_type: str
    title: str
    owner_role: str
    unit: str
    dependency: str
    status: str
    severity: str
    sla_minutes_remaining: int
    estimated_beds_unlocked: int
    estimated_bed_hour_impact: float
    confidence: float
    trend: str
    reason: str


class CapacityAction(BaseModel):
    id: str
    priority: int
    title: str
    action_type: str
    owner: str
    owner_role: str
    unit: str
    status: str
    severity: str
    escalation_state: str
    sla_deadline: str
    minutes_to_deadline: int
    dependency_ids: List[str]
    dependency_label: str
    expected_beds_unlocked: int
    expected_bed_hours_saved: float
    reason: str
    patients_impacted: int
    last_updated: str


class CapacityCommandCenter(BaseModel):
    product_name: str
    hospital_name: str
    unit_name: str
    shift: str
    current_time: str
    horizon_minutes: int
    risk_window: str
    service_health: List[dict]
    kpis: List[CapacityKpi]
    timeline: List[CapacityTimelinePoint]
    flow_nodes: List[CapacityFlowNode]
    flow_edges: List[CapacityFlowEdge]
    blockers: List[CapacityBlocker]
    actions: List[CapacityAction]
    selected_action_id: str


class CapacityActionUpdate(BaseModel):
    status: Optional[str] = Field(default=None, pattern="^(queued|assigned|in_progress|escalated|done)$")
    owner: Optional[str] = None
    escalation_state: Optional[str] = Field(default=None, pattern="^(none|monitor|at_risk|escalated|resolved)$")
    note: Optional[str] = None


class SimulationScenario(BaseModel):
    extra_staffed_beds: int = Field(default=0, ge=0, le=12)
    evs_rooms_prioritized: int = Field(default=0, ge=0, le=24)
    transporters_added: int = Field(default=0, ge=0, le=8)
    accelerated_discharges: int = Field(default=0, ge=0, le=24)
    observation_overflow: int = Field(default=0, ge=0, le=20)


class SimulationResult(BaseModel):
    scenario: SimulationScenario
    projected_boarding_hours: float
    baseline_boarding_hours: float
    boarding_hours_reduced: float
    beds_unlocked: int
    risk_window_after: str
    recommended_actions: List[str]
    explanation: str
