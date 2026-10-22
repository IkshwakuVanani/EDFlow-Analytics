import os
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.pool import NullPool
from sqlalchemy.orm import Session, declarative_base, sessionmaker


def normalize_database_url(url: str) -> str:
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+psycopg://", 1)
    elif url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg://", 1)
    if url.startswith("postgresql+psycopg://"):
        # Integration metadata and Prisma pool hints are not libpq parameters.
        parsed = make_url(url).difference_update_query(["supa", "pgbouncer", "connection_limit", "pool_timeout", "schema"])
        if parsed.host and parsed.host.endswith("supabase.com") and "sslmode" not in parsed.query:
            parsed = parsed.update_query_dict({"sslmode": "require"})
        return parsed.render_as_string(hide_password=False)
    return url


DATABASE_URL = normalize_database_url(os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL") or "sqlite:///./edflow.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {"prepare_threshold": None}
engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    future=True,
    pool_pre_ping=True,
    **({"poolclass": NullPool} if DATABASE_URL.startswith("postgresql") else {}),
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)
Base = declarative_base()


def init_db() -> None:
    from app.db import models, operations  # noqa: F401

    Base.metadata.create_all(bind=engine)
    operations.init_operations_db()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
