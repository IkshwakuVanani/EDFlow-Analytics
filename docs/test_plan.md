# Test Plan

## Automated Checks

Backend:

```bash
cd backend
.venv/bin/python -m pytest
```

Frontend:

```bash
cd frontend
npm run build
```

Repository:

```bash
git diff --check
```

## API Smoke Tests

```bash
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:8000/capacity/command-center
curl http://127.0.0.1:8000/capacity/blockers
curl http://127.0.0.1:8000/capacity/actions
curl -X POST http://127.0.0.1:8000/capacity/simulate \
  -H "Content-Type: application/json" \
  -d '{"extra_staffed_beds":2,"evs_rooms_prioritized":4,"transporters_added":1,"accelerated_discharges":3,"observation_overflow":0}'
```

## Manual Demo QA

Verify:

- Command Center loads with KPI, timeline, flow graph, blockers, actions, and action details.
- Mark Done updates the selected action state.
- Simulate opens the Simulation page.
- Evidence opens the CMS analytics layer.
- Mobile view reaches the dashboard without horizontal overflow.
- No screen presents the app as clinical decision support.
