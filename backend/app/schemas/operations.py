from datetime import datetime, timezone
from typing import Literal
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, field_validator, model_validator


class Input(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)


class Credentials(Input):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=False)
    username: str = Field(min_length=3, max_length=80, pattern=r'^[a-zA-Z0-9_.@-]+$')
    password: str = Field(min_length=12, max_length=200)


class Stage(Input):
    id: str = Field(min_length=1, max_length=80, pattern=r'^[a-zA-Z0-9_-]+$')
    label: str = Field(min_length=1, max_length=100)
    kind: Literal['arrival', 'care', 'transfer', 'discharge', 'support'] = 'care'
    owner: str = Field(default='', max_length=100)


class Edge(Input):
    source: str
    target: str
    label: str = Field(default='', max_length=100)


class FlowGraph(Input):
    nodes: list[Stage] = Field(default_factory=list, max_length=100)
    edges: list[Edge] = Field(default_factory=list, max_length=300)

    @model_validator(mode='after')
    def check_links(self):
        ids = [node.id for node in self.nodes]
        if len(ids) != len(set(ids)):
            raise ValueError('Stage IDs must be unique')
        pairs = set()
        for edge in self.edges:
            if edge.source not in ids or edge.target not in ids or edge.source == edge.target:
                raise ValueError('Connections must link two different existing stages')
            pair = (edge.source, edge.target)
            if pair in pairs:
                raise ValueError('Duplicate connection')
            pairs.add(pair)
        return self


class HospitalCreate(Input):
    name: str = Field(min_length=2, max_length=160)
    timezone: str = 'UTC'
    graph: FlowGraph = Field(default_factory=FlowGraph)

    @field_validator('timezone')
    @classmethod
    def valid_timezone(cls, value):
        try:
            ZoneInfo(value)
        except (ZoneInfoNotFoundError, ValueError):
            raise ValueError('Use a valid IANA time zone, such as America/New_York')
        return value


class GraphUpdate(FlowGraph):
    version: int = Field(ge=1)


class ObservationInput(Input):
    stage_id: str = Field(min_length=1, max_length=80)
    observed_at: AwareDatetime
    waiting: int = Field(ge=0, le=100000)
    occupied: int = Field(ge=0, le=100000)
    staffed_capacity: int = Field(ge=0, le=100000)
    arrivals: int = Field(ge=0, le=100000)
    departures: int = Field(ge=0, le=100000)
    interval_minutes: int = Field(ge=1, le=1440)

    @field_validator('observed_at')
    @classmethod
    def valid_time(cls, value):
        value = value.astimezone(timezone.utc)
        if value.timestamp() > datetime.now(timezone.utc).timestamp() + 300:
            raise ValueError('Observation timestamps cannot be in the future')
        return value


class ObservationBatch(Input):
    observations: list[ObservationInput] = Field(min_length=1, max_length=5000)
    dry_run: bool = False


class TaskCreate(Input):
    title: str = Field(min_length=3, max_length=240)
    stage_id: str = Field(min_length=1, max_length=80)
    owner: str = Field(min_length=1, max_length=100)
    due_at: AwareDatetime
    notes: str = Field(default='', max_length=4000)


class TaskUpdate(Input):
    version: int = Field(ge=1)
    status: Literal['queued', 'in_progress', 'blocked', 'done']
    owner: str = Field(min_length=1, max_length=100)
    notes: str = Field(default='', max_length=4000)


class InvitationAccept(Input):
    code: str = Field(min_length=20, max_length=200)
