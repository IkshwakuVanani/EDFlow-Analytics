# Capacity Orchestration Thesis

EDFlow Orchestrator is a hospital operations prototype for turning forecasted ED boarding pressure into accountable bed-conversion work.

The MVP is intentionally narrow: admitted ED boarders who need med-surg placement. The system models the operational path from pending discharge to ready bed, then ranks blockers by estimated capacity impact instead of simply showing queue age or volume.

## Workflow

1. Forecast near-term boarding pressure across the next six hours.
2. Represent the bed-conversion chain as a capacity graph:
   `ED boarders -> pending discharges -> EVS clean -> transport -> ready beds`.
3. Rank blockers by estimated bed-hour impact.
4. Generate next-best actions with owner, SLA, dependency, escalation state, and expected beds unlocked.
5. Let operators run what-if scenarios for staffing, EVS, transport, discharge acceleration, and observation overflow.

## Prototype Boundaries

- Uses synthetic operations data only.
- Does not include patient-level clinical prediction.
- Does not integrate with a live EHR, ADT feed, FHIR server, or hospital paging system.
- Keeps CMS hospital-quality analytics as supporting evidence, not as the primary product surface.

## Success Criteria

The product should make the operator's next action obvious:

- what capacity is at risk
- what blocker matters most
- who owns the task
- when the deadline expires
- what capacity impact is expected
- whether escalation is needed
