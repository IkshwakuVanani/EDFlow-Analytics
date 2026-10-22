"""Operations-only application: no seeded records and no modeling dependencies."""
from contextlib import asynccontextmanager
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.api.routes_operations import router
from app.db.database import SessionLocal, init_db


@asynccontextmanager
async def lifespan(app):
    if os.getenv('VERCEL') and not os.getenv('DATABASE_URL', '').startswith(('postgres://', 'postgresql://', 'postgresql+psycopg://')):
        raise RuntimeError('Set DATABASE_URL to a persistent PostgreSQL database before deploying EDFlow.')
    init_db()
    yield


def create_app(prefix=''):
    application = FastAPI(title='EDFlow Orchestrator', version='1.0.0', lifespan=lifespan, docs_url=prefix + '/docs', openapi_url=prefix + '/openapi.json')
    origins = os.getenv('CORS_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173')
    application.add_middleware(CORSMiddleware, allow_origins=[origin.strip() for origin in origins.split(',') if origin.strip()], allow_methods=['GET', 'POST', 'PUT', 'PATCH'], allow_headers=['Content-Type', 'Authorization'])
    application.include_router(router, prefix=prefix)

    @application.get(prefix + '/health')
    def health():
        with SessionLocal() as db:
            db.execute(text('SELECT 1'))
        return {'status': 'ok', 'service': 'edflow-orchestrator', 'data_mode': 'hospital_observations'}
    return application


app = create_app()
