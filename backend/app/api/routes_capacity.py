from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.capacity import (
    CapacityAction,
    CapacityActionUpdate,
    CapacityBlocker,
    CapacityCommandCenter,
    SimulationResult,
    SimulationScenario,
)
from app.services import capacity_service

router = APIRouter(prefix="/capacity", tags=["capacity orchestration"])


@router.get("/command-center", response_model=CapacityCommandCenter)
def command_center(
    window_minutes: int = Query(default=360, ge=30, le=720),
    db: Session = Depends(get_db),
) -> dict:
    return capacity_service.get_command_center(window_minutes=window_minutes, db=db)


@router.get("/blockers", response_model=List[CapacityBlocker])
def blockers() -> list[dict]:
    return capacity_service.get_blockers()


@router.get("/actions", response_model=List[CapacityAction])
def actions(db: Session = Depends(get_db)) -> list[dict]:
    return capacity_service.get_actions(db=db)


@router.patch("/actions/{action_id}", response_model=CapacityAction)
def update_action(action_id: str, update: CapacityActionUpdate, db: Session = Depends(get_db)) -> dict:
    action = capacity_service.update_action(action_id, update, db=db)
    if action is None:
        raise HTTPException(status_code=404, detail="Capacity action not found")
    return action


@router.post("/simulate", response_model=SimulationResult)
def simulate(scenario: SimulationScenario) -> dict:
    return capacity_service.simulate_capacity(scenario)
