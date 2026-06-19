"""
Alembic environment for NexusAI.

Key design decisions:
- Uses async SQLAlchemy engine to match the app engine.
- Reads DATABASE_URL from app.core.config (single source of truth).
- Imports ALL models so autogenerate sees the full schema.
"""
import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

# ── Load app config (reads .env) ───────────────────────────────────────────────
from app.core.config import settings

# ── Import Base AND all models so Alembic can see every table ─────────────────
# This is the fix for the gap-analysis bug:
#   "app/models/__init__.py is empty — Alembic generates empty migrations"
from app.core.database import Base
import app.models  # noqa: F401 — side-effect import registers all ORM classes

# Alembic Config object
config = context.config

# Wire up the DATABASE_URL from settings (overrides the blank in alembic.ini)
config.set_main_option("sqlalchemy.url", settings.database_url)

# Configure stdlib logging from alembic.ini [loggers] section
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# The metadata object that autogenerate inspects
target_metadata = Base.metadata


# ── Offline mode (no live DB connection) ──────────────────────────────────────

def run_migrations_offline() -> None:
    """Generate SQL scripts without connecting to the database."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


# ── Online mode (async engine) ────────────────────────────────────────────────

def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,          # detect column type changes
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Create an async engine and run migrations through a sync connection."""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,   # no pooling — migrations are one-shot
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


# ── Entry point ───────────────────────────────────────────────────────────────

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
