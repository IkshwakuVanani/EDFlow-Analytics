# Deployment Guide

This project has two deployable surfaces:

- FastAPI backend: capacity orchestration APIs plus CMS evidence APIs
- Vite frontend: EDFlow Orchestrator command-center UI

The repository includes GitHub Actions in `.github/workflows/ci.yml`. Keep the backend test job and frontend build job passing before deploying or promoting changes.

The simplest public rollout is:

1. Deploy the backend to Render from this GitHub repo.
2. Deploy the frontend to Vercel or Netlify.
3. Set the frontend API URL to the backend URL.
4. Set backend CORS to allow the frontend URL.

## Backend On Render

Use the included `render.yaml` Blueprint.

1. Push the repo to GitHub.
2. In Render, create a new Blueprint from the repo.
3. Let Render create:
   - `edflow-orchestrator-api`
   - `edflow-orchestrator-db`
4. After the frontend is deployed, set the backend env var:

```bash
CORS_ORIGINS=https://your-frontend-domain.vercel.app,http://localhost:5173,http://127.0.0.1:5173
```

The backend uses synthetic operations seed data by default:

```bash
EDFLOW_SEED_SAMPLE=true
```

The app normalizes managed PostgreSQL connection strings to the installed `psycopg` SQLAlchemy driver, so Render-style `postgres://` and `postgresql://` URLs are supported.

## Frontend On Vercel

Deploy only the `frontend/` directory.

Vercel settings:

```text
Framework Preset: Vite
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
```

Environment variable:

```bash
VITE_API_BASE_URL=https://your-render-backend-url.onrender.com
```

For a production deployment, use Vercel's Git integration so every push runs the Vercel build. Keep preview deployments for branches and promote only after CI passes.

## Frontend On Netlify

Netlify settings:

```text
Base directory: frontend
Build command: npm run build
Publish directory: frontend/dist
```

Environment variable:

```bash
VITE_API_BASE_URL=https://your-render-backend-url.onrender.com
```

## Smoke Tests

After deployment:

```bash
curl https://your-render-backend-url.onrender.com/health
curl https://your-render-backend-url.onrender.com/capacity/command-center
```

Then open the frontend and click:

1. Command Center
2. Mark Done
3. Simulation
4. Evidence

## Real-World Functionality Checklist

The current public deployment target is a synthetic-data demo. Before using this as a real hospital operations product, add:

- Authentication and role-based access for operations users.
- Persistent capacity action tables for assignment, notes, escalation, and completion history.
- Database migrations for schema changes.
- Observability: structured logs, error monitoring, uptime checks, and deployment alerts.
- Rate limiting, strict CORS, and a security review before any non-demo exposure.
- A real event ingestion path for ADT-like events, bed status, EVS state, transport queues, staffing, and discharge barriers.
- Compliance planning before storing any PHI or real patient-level operational data.

## Notes

- Render free services may sleep after inactivity, so the first API request can be slow.
- Do not deploy real patient data to this prototype.
- If the frontend cannot reach the backend, it falls back to local synthetic demo data.
