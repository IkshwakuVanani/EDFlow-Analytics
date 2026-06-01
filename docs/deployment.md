# Deployment Guide

This project has two deployable surfaces:

- FastAPI backend: capacity orchestration APIs plus CMS evidence APIs
- Vite frontend: EDFlow Orchestrator command-center UI

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

## Notes

- Render free services may sleep after inactivity, so the first API request can be slow.
- Do not deploy real patient data to this prototype.
- If the frontend cannot reach the backend, it falls back to local synthetic demo data.
