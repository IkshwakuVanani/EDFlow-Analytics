from __future__ import annotations

from copy import deepcopy
from typing import Optional

from app.schemas.capacity import CapacityActionUpdate, SimulationScenario


SERVICE_HEALTH = [
    {"label": "EHR", "status": "online"},
    {"label": "ADT", "status": "online"},
    {"label": "Capacity", "status": "online"},
    {"label": "RTLS", "status": "online"},
    {"label": "EVS", "status": "watch"},
]

KPIS = [
    {"id": "ed_boarders", "label": "ED boarders", "value": "42", "severity": "high", "trend": "+6 vs 1h ago", "detail": "Admitted patients awaiting inpatient placement"},
    {"id": "boarding_hours", "label": "Predicted boarding hours", "value": "312", "severity": "high", "trend": "+48 vs 1h ago", "detail": "Forecast exposure across the next six hours"},
    {"id": "unlockable_beds", "label": "Beds unlockable", "value": "18", "severity": "moderate", "trend": "+5 vs 1h ago", "detail": "Likely beds available if blockers clear on time"},
    {"id": "sla_tasks", "label": "At-risk SLA tasks", "value": "27", "severity": "high", "trend": "+9 vs 1h ago", "detail": "Tasks likely to miss owner deadline"},
]

TIMELINE = [
    {"time": "08:00", "time_label": "8 AM", "boarders": 34, "predicted_boarders": 34, "available_beds": 14, "unlockable_beds": 10, "risk_window": False, "action_marker": None},
    {"time": "09:00", "time_label": "9 AM", "boarders": 46, "predicted_boarders": 45, "available_beds": 17, "unlockable_beds": 12, "risk_window": False, "action_marker": "Transport pull-forward"},
    {"time": "10:00", "time_label": "10 AM", "boarders": 47, "predicted_boarders": 48, "available_beds": 19, "unlockable_beds": 14, "risk_window": False, "action_marker": None},
    {"time": "11:00", "time_label": "11 AM", "boarders": 50, "predicted_boarders": 54, "available_beds": 20, "unlockable_beds": 15, "risk_window": False, "action_marker": None},
    {"time": "12:00", "time_label": "12 PM", "boarders": 54, "predicted_boarders": 61, "available_beds": 20, "unlockable_beds": 16, "risk_window": False, "action_marker": "EVS priority batch"},
    {"time": "13:00", "time_label": "1 PM", "boarders": 56, "predicted_boarders": 68, "available_beds": 22, "unlockable_beds": 17, "risk_window": False, "action_marker": None},
    {"time": "14:00", "time_label": "2 PM", "boarders": 47, "predicted_boarders": 73, "available_beds": 22, "unlockable_beds": 18, "risk_window": True, "action_marker": "Discharge meds expedite"},
    {"time": "15:00", "time_label": "3 PM", "boarders": 48, "predicted_boarders": 79, "available_beds": 22, "unlockable_beds": 18, "risk_window": True, "action_marker": None},
    {"time": "16:00", "time_label": "4 PM", "boarders": 48, "predicted_boarders": 84, "available_beds": 22, "unlockable_beds": 18, "risk_window": True, "action_marker": None},
    {"time": "17:00", "time_label": "5 PM", "boarders": 52, "predicted_boarders": 87, "available_beds": 26, "unlockable_beds": 19, "risk_window": True, "action_marker": None},
    {"time": "18:00", "time_label": "6 PM", "boarders": 48, "predicted_boarders": 87, "available_beds": 24, "unlockable_beds": 18, "risk_window": True, "action_marker": None},
    {"time": "19:00", "time_label": "7 PM", "boarders": 47, "predicted_boarders": 86, "available_beds": 24, "unlockable_beds": 16, "risk_window": False, "action_marker": None},
    {"time": "20:00", "time_label": "8 PM", "boarders": 34, "predicted_boarders": 84, "available_beds": 17, "unlockable_beds": 13, "risk_window": False, "action_marker": None},
]

FLOW_NODES = [
    {"id": "ed_boarders", "label": "ED Boarders", "value": 42, "severity": "high", "category": "demand"},
    {"id": "pending_discharges", "label": "Pending Discharges", "value": 76, "severity": "moderate", "category": "capacity"},
    {"id": "evs_clean", "label": "Room Clean", "value": 22, "severity": "moderate", "category": "task"},
    {"id": "transport", "label": "Transport Queue", "value": 14, "severity": "high", "category": "task"},
    {"id": "placement", "label": "Placement Mismatch", "value": 11, "severity": "moderate", "category": "task"},
    {"id": "ready_beds", "label": "Ready Beds", "value": 18, "severity": "moderate", "category": "capacity"},
]

FLOW_EDGES = [
    {"source": "ed_boarders", "target": "pending_discharges", "label": "needs bed path", "count": 42, "severity": "high"},
    {"source": "pending_discharges", "target": "evs_clean", "label": "rooms to turn", "count": 22, "severity": "moderate"},
    {"source": "pending_discharges", "target": "transport", "label": "patients to move", "count": 14, "severity": "high"},
    {"source": "pending_discharges", "target": "placement", "label": "bed class mismatch", "count": 11, "severity": "moderate"},
    {"source": "evs_clean", "target": "ready_beds", "label": "clean complete", "count": 18, "severity": "moderate"},
    {"source": "transport", "target": "ready_beds", "label": "arrival pending", "count": 10, "severity": "high"},
    {"source": "placement", "target": "ready_beds", "label": "assignment review", "count": 8, "severity": "moderate"},
]

BLOCKERS = [
    {"id": "blk-discharge-meds", "rank": 1, "blocker_type": "Discharge meds", "title": "Discharge meds pending", "owner_role": "Pharmacy", "unit": "3W Med-Surg", "dependency": "Medication reconciliation", "status": "at_risk", "severity": "high", "sla_minutes_remaining": 36, "estimated_beds_unlocked": 6, "estimated_bed_hour_impact": 12.0, "confidence": 0.86, "trend": "up", "reason": "Twelve discharge-ready patients are waiting on meds before room release."},
    {"id": "blk-evs-turnover", "rank": 2, "blocker_type": "EVS turnover", "title": "EVS turnover delay", "owner_role": "Environmental Services", "unit": "5B / 4N", "dependency": "Dirty rooms batched", "status": "at_risk", "severity": "high", "sla_minutes_remaining": 51, "estimated_beds_unlocked": 5, "estimated_bed_hour_impact": 9.0, "confidence": 0.81, "trend": "up", "reason": "Eight dirty rooms map directly to med-surg boarders awaiting assignment."},
    {"id": "blk-transport", "rank": 3, "blocker_type": "Transport", "title": "Transport queue backlog", "owner_role": "Transport", "unit": "ED to 3W", "dependency": "Pickup queue depth", "status": "at_risk", "severity": "high", "sla_minutes_remaining": 46, "estimated_beds_unlocked": 4, "estimated_bed_hour_impact": 7.0, "confidence": 0.74, "trend": "up", "reason": "Ready beds are not usable until boarders physically leave the ED."},
    {"id": "blk-staffing", "rank": 4, "blocker_type": "Staffing", "title": "Staffing confirmation", "owner_role": "Nursing Admin", "unit": "3W Med-Surg", "dependency": "RN coverage for 11 AM cohort", "status": "monitor", "severity": "moderate", "sla_minutes_remaining": 96, "estimated_beds_unlocked": 3, "estimated_bed_hour_impact": 6.0, "confidence": 0.69, "trend": "flat", "reason": "Beds can open only if staffed before the afternoon risk window."},
    {"id": "blk-placement", "rank": 5, "blocker_type": "Placement", "title": "Placement mismatch", "owner_role": "Case Management", "unit": "ED / Med-Surg", "dependency": "Telemetry downgrade review", "status": "monitor", "severity": "moderate", "sla_minutes_remaining": 126, "estimated_beds_unlocked": 2, "estimated_bed_hour_impact": 5.0, "confidence": 0.63, "trend": "flat", "reason": "Several boarders need a med-surg alternative to a higher-acuity bed request."},
]

_ACTIONS = [
    {"id": "act-discharge-meds", "priority": 1, "title": "Expedite discharge meds for 12 patients", "action_type": "Discharge meds", "owner": "Pharmacy Team A", "owner_role": "Pharmacy", "unit": "3W Med-Surg", "status": "assigned", "severity": "high", "escalation_state": "at_risk", "sla_deadline": "09:00 AM", "minutes_to_deadline": 36, "dependency_ids": ["blk-discharge-meds"], "dependency_label": "Has dependency", "expected_beds_unlocked": 6, "expected_bed_hours_saved": 18.0, "reason": "This clears the highest-impact discharge blocker and converts discharge-ready rooms into staffed beds before the risk window.", "patients_impacted": 12, "last_updated": "08:24 AM"},
    {"id": "act-evs-priority", "priority": 2, "title": "Prioritize EVS for 8 dirty rooms", "action_type": "EVS turnover", "owner": "EVS Team B", "owner_role": "Environmental Services", "unit": "5B / 4N", "status": "queued", "severity": "high", "escalation_state": "at_risk", "sla_deadline": "09:15 AM", "minutes_to_deadline": 51, "dependency_ids": ["blk-evs-turnover"], "dependency_label": "Has dependency", "expected_beds_unlocked": 5, "expected_bed_hours_saved": 13.5, "reason": "EVS turnover is the next bottleneck after pending discharge orders are released.", "patients_impacted": 8, "last_updated": "08:24 AM"},
    {"id": "act-transport-pull", "priority": 3, "title": "Move 5 patients in transport queue", "action_type": "Transport", "owner": "Transport Lead", "owner_role": "Transport", "unit": "ED to 3W", "status": "queued", "severity": "high", "escalation_state": "at_risk", "sla_deadline": "09:10 AM", "minutes_to_deadline": 46, "dependency_ids": ["blk-transport"], "dependency_label": "Has dependency", "expected_beds_unlocked": 4, "expected_bed_hours_saved": 10.0, "reason": "Ready beds remain latent capacity until boarders are physically moved out of the ED.", "patients_impacted": 5, "last_updated": "08:24 AM"},
    {"id": "act-staffing-confirm", "priority": 4, "title": "Confirm RN staffing on 3W for 11 AM", "action_type": "Staffing", "owner": "Nursing Admin", "owner_role": "Nursing Admin", "unit": "3W Med-Surg", "status": "queued", "severity": "moderate", "escalation_state": "monitor", "sla_deadline": "10:00 AM", "minutes_to_deadline": 96, "dependency_ids": ["blk-staffing"], "dependency_label": "Has dependency", "expected_beds_unlocked": 3, "expected_bed_hours_saved": 7.5, "reason": "Staffing confirmation protects the beds expected to unlock during the risk window.", "patients_impacted": 6, "last_updated": "08:24 AM"},
    {"id": "act-placement-review", "priority": 5, "title": "Resolve placement mismatch for 11 patients", "action_type": "Placement", "owner": "Case Mgmt Team C", "owner_role": "Case Management", "unit": "ED / Med-Surg", "status": "queued", "severity": "moderate", "escalation_state": "monitor", "sla_deadline": "10:30 AM", "minutes_to_deadline": 126, "dependency_ids": ["blk-placement"], "dependency_label": "Has dependency", "expected_beds_unlocked": 2, "expected_bed_hours_saved": 5.0, "reason": "Downgrade review can redirect boarders to med-surg beds without waiting on telemetry capacity.", "patients_impacted": 11, "last_updated": "08:24 AM"},
]


def get_command_center(window_minutes: int = 360) -> dict:
    return {
        "product_name": "EDFlow Orchestrator",
        "hospital_name": "Cityview Medical Center",
        "unit_name": "Med-Surg Capacity",
        "shift": "Day shift",
        "current_time": "08:24 AM",
        "horizon_minutes": window_minutes,
        "risk_window": "1:30 PM - 6:00 PM",
        "service_health": deepcopy(SERVICE_HEALTH),
        "kpis": deepcopy(KPIS),
        "timeline": _windowed_timeline(window_minutes),
        "flow_nodes": deepcopy(FLOW_NODES),
        "flow_edges": deepcopy(FLOW_EDGES),
        "blockers": get_blockers(),
        "actions": get_actions(),
        "selected_action_id": _ACTIONS[0]["id"],
    }


def get_blockers() -> list[dict]:
    return sorted(deepcopy(BLOCKERS), key=lambda row: row["estimated_bed_hour_impact"], reverse=True)


def get_actions() -> list[dict]:
    return sorted(deepcopy(_ACTIONS), key=lambda row: row["priority"])


def update_action(action_id: str, update: CapacityActionUpdate) -> Optional[dict]:
    for action in _ACTIONS:
        if action["id"] == action_id:
            payload = update.model_dump(exclude_none=True)
            if "status" in payload:
                action["status"] = payload["status"]
                if payload["status"] == "done":
                    action["escalation_state"] = "resolved"
                    action["severity"] = "low"
                if payload["status"] == "escalated":
                    action["escalation_state"] = "escalated"
                    action["severity"] = "high"
            if "owner" in payload:
                action["owner"] = payload["owner"]
            if "escalation_state" in payload:
                action["escalation_state"] = payload["escalation_state"]
            if action["escalation_state"] in {"at_risk", "escalated"}:
                action["severity"] = "high"
            elif action["escalation_state"] == "monitor":
                action["severity"] = "moderate"
            elif action["escalation_state"] == "resolved":
                action["severity"] = "low"
            action["last_updated"] = "08:31 AM"
            return deepcopy(action)
    return None


def simulate_capacity(scenario: SimulationScenario) -> dict:
    baseline = 312.0
    beds_unlocked = (
        scenario.extra_staffed_beds
        + scenario.evs_rooms_prioritized
        + scenario.transporters_added * 2
        + scenario.accelerated_discharges
        + min(scenario.observation_overflow, 10)
    )
    reduction = min(166.0, beds_unlocked * 4.6 + scenario.accelerated_discharges * 1.2)
    projected = max(0.0, baseline - reduction)
    if projected < 180:
        risk_window = "Reduced to monitor status after 4:30 PM"
    elif projected < 250:
        risk_window = "Compressed by about 90 minutes"
    else:
        risk_window = "Still active from 1:30 PM - 6:00 PM"
    actions = []
    if scenario.accelerated_discharges:
        actions.append("Run discharge-med expedite for pharmacy and bedside teams")
    if scenario.evs_rooms_prioritized:
        actions.append("Batch EVS turnover by med-surg bed class")
    if scenario.transporters_added:
        actions.append("Pull transport capacity forward before the afternoon risk window")
    if scenario.extra_staffed_beds:
        actions.append("Confirm RN coverage before marking beds available")
    if not actions:
        actions.append("Select at least one capacity lever to compare against baseline")
    return {
        "scenario": scenario,
        "projected_boarding_hours": round(projected, 1),
        "baseline_boarding_hours": baseline,
        "boarding_hours_reduced": round(reduction, 1),
        "beds_unlocked": beds_unlocked,
        "risk_window_after": risk_window,
        "recommended_actions": actions,
        "explanation": "Simulation uses synthetic operations assumptions to estimate how fast latent capacity becomes usable med-surg capacity.",
    }


def _windowed_timeline(window_minutes: int) -> list[dict]:
    if window_minutes <= 120:
        return deepcopy(TIMELINE[:5])
    if window_minutes <= 360:
        return deepcopy(TIMELINE)
    return deepcopy(TIMELINE)
