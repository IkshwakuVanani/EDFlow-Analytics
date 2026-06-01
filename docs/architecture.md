# EDFlow Orchestrator Architecture

EDFlow Orchestrator is organized as a small hospital operations platform with a supporting public-data evidence layer:

- `backend/app/services/capacity_service.py` provides synthetic med-surg capacity orchestration data, blocker ranking, action updates, and what-if simulation.
- `backend/app/api/routes_capacity.py` exposes the command-center, blocker, action, and simulation contracts.
- `frontend/` renders the operational command center first, then keeps CMS analytics under the Evidence tab.
- `pipelines/` ingests CMS Provider Data Catalog rows, transforms ED measures, validates data quality, and builds modeling datasets for the Evidence layer.
- `data/raw/` and `data/processed/` are local pipeline workspaces and are ignored by Git.

The backend starts with local synthetic operations data and CMS seed data so the API and dashboard run before any live CMS ingest is executed. Running the pipelines replaces the CMS evidence path with CMS-derived tables, while the orchestration prototype remains synthetic until a real hospital integration exists.
