# EDFlow Analytics Architecture

EDFlow Analytics is organized as a small healthcare data platform:

- `pipelines/` ingests CMS Provider Data Catalog rows, transforms ED measures, validates data quality, and builds modeling datasets.
- `backend/` serves FastAPI endpoints backed by SQLAlchemy models for hospitals, ED summaries, quality checks, and modeling outputs.
- `frontend/` renders a React dashboard for analysts and hospital operations users.
- `data/raw/` and `data/processed/` are local pipeline workspaces and are ignored by Git.

The backend starts with local seed data so the API and dashboard run before the live CMS ingest is executed. Running the pipelines replaces that local development path with CMS-derived tables.
