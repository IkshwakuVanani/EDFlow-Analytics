import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api import routes_ed, routes_hospitals, routes_models, routes_quality
from app.db.database import SessionLocal, init_db
from app.services.sample_data import seed_sample_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    if os.getenv("EDFLOW_SEED_SAMPLE", "true").lower() in {"1", "true", "yes"}:
        db = SessionLocal()
        try:
            seed_sample_data(db)
        finally:
            db.close()
    yield


app = FastAPI(
    title="EDFlow Analytics API",
    version="0.1.0",
    description="Hospital-level Emergency Department throughput analytics using public CMS quality data.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["health"])
def health() -> dict:
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
    finally:
        db.close()
    return {
        "status": "ok",
        "service": "edflow-analytics-api",
        "data_mode": "sample_seed_or_cms_loaded",
    }


app.include_router(routes_hospitals.router)
app.include_router(routes_ed.router)
app.include_router(routes_quality.router)
app.include_router(routes_models.router)
