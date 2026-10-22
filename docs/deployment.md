# Setup and deployment

## Local development

Python 3.10+ and Node.js 22 are recommended.

```bash
python3 -m venv backend/.venv
backend/.venv/bin/pip install -r backend/requirements.txt
backend/.venv/bin/python -m uvicorn app.production:app --app-dir backend --reload
```

In another terminal:

```bash
npm ci --prefix frontend
npm run dev --prefix frontend
```

The development frontend calls `http://localhost:8000`. By default local Python runs use SQLite. Docker Compose uses PostgreSQL with a persistent volume. `app.production` exposes only the authenticated hospital operations routes; `app.main` also retains the legacy CMS research endpoints.

Create an account with a unique username and a password of at least 12 characters. Sessions expire after seven days and are kept in the browser tab's session storage. Sign-out revokes the server-side token. Email-based password recovery is not configured.

## Data input

Create a hospital with its IANA time zone, then define its flow in the Flow map tab. A JSON flow has `nodes` (unique `id`, `label`, `kind`, `owner`) and directed `edges` (`source`, `target`, `label`). Graphs support up to 100 stages and 300 connections, including cyclical processes. Images and PDFs must be transcribed into structured stages and connections. Stages referenced by observations or tasks cannot be removed.

Import up to 5,000 CSV observations at a time, using exactly these columns:

```csv
stage_id,observed_at,waiting,occupied,staffed_capacity,arrivals,departures,interval_minutes
```

Use ISO timestamps with an offset, such as `2026-10-22T14:00:00-04:00`. Waiting, occupied, and staffed capacity are point-in-time counts. Arrivals and departures cover the interval ending at the observation timestamp. Non-overlapping intervals prevent double-counted throughput. Exact duplicates are skipped; conflicting duplicates reject the batch. Validate imports before saving. The import schema contains only aggregate fields. Do not enter patient identifiers or clinical information into workspace names, task notes, or other free-text fields.

Use the manual observation form for updates, CSV imports for batches, or the authenticated REST API for a polling/feed integration. EDFlow refreshes saved analysis and tasks every 15 seconds while the browser tab is visible. It does not connect to an EHR automatically.

## Analysis semantics

The overall chart includes only timestamps where every configured stage reported. Stage summaries use each stage's latest record in the window, with missing or stale coverage disclosed. Counts across stages are not unique patient totals. Throughput is departures divided by the duration of complete reporting intervals inside the analysis window. Queue changes compare first and last observations. Trend slopes use elapsed hours and require three observations spanning at least 30 minutes. A 60-minute linear extrapolation is hidden when data is more than 30 minutes old relative to the window end. These descriptive calculations do not establish causation or validate clinical decisions.

Use custom dates for historical datasets. All analysis can be exported as JSON; saved observations can be exported as CSV. Workspace owners can generate single-use, 24-hour invitation codes; collaborators can edit that hospital's flow, observations, and tasks. Optimistic versions prevent silently overwriting another user's graph or task edits.

## Hosted deployment

The repository root contains a Vercel configuration for the frontend and Python API together. Set the Vercel project root to the repository root, not `frontend/`. The frontend uses the same-origin `/api` route. The Python API requires a persistent PostgreSQL `DATABASE_URL` (or the Vercel integration’s `POSTGRES_URL`); it refuses to start on Vercel with ephemeral SQLite storage.

Required server configuration:

- `DATABASE_URL` or `POSTGRES_URL`: PostgreSQL connection string; managed `postgres://` URLs are normalized to psycopg.
- `EDFLOW_ALLOW_REGISTRATION`: `true` to allow account creation, `false` to close registration.
- `CORS_ORIGINS`: comma-separated frontend origins only when frontend and API use different origins.

Database passwords and connection strings belong in provider environment settings, never Git. Operations tables are created from SQLAlchemy metadata in a private `edflow` PostgreSQL schema on API startup, with public schema/table privileges revoked and row-level security enabled. Hospital access is enforced by the API through account membership. The direct database connection must own these tables; do not expose the private schema through a public data API. Existing deployments must have the new tables initialized before serving traffic; schema evolution beyond this initial addition needs reviewed migrations.

Alternatively deploy `render.yaml` to host the operations API with managed PostgreSQL, set `VITE_API_BASE_URL` to the API URL, and rebuild the frontend. Database hosting must be provisioned separately; the old static frontend deployment alone cannot provide shared persistence.

Verify registration → hospital creation → flow save → CSV validation/import → analysis → task update → sign-out/sign-in. Repeat from a second account joined by an invitation to verify shared state and access isolation. Test `/health` (or `/api/health` on Vercel) and monitor server logs. Account access does not imply the application is approved to process patient-identifying data.
