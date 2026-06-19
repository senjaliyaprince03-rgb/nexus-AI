"""NexusAI FastAPI application factory."""
from __future__ import annotations
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.logging import configure_logging
from app.utils.storage import ensure_storage_dirs


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    ensure_storage_dirs()

    # Observability — initialise before anything else
    from app.core.sentry import configure_sentry
    from app.core.langsmith_tracing import configure_langsmith
    configure_sentry()
    configure_langsmith()

    # Startup: verify MongoDB and Redis are reachable, then create indexes.
    from app.core.database import init_indexes, ping_database
    from app.core.redis import get_redis_pool
    try:
        await ping_database()
    except Exception as exc:
        import structlog
        log = structlog.get_logger()
        log.warning(
            "⚠️ MongoDB is unreachable. Gracefully falling back to mock database (mongomock).",
            error=str(exc)
        )
        from app.core.mongo import force_mock_client
        force_mock_client()
        await ping_database()

    await init_indexes()
    await get_redis_pool()

    import structlog
    log = structlog.get_logger()

    # Loud warnings for missing AI provider keys
    llm_key, _ = settings.get_llm_credentials()
    if not llm_key:
        log.warning(
            "⚠️  NO LLM API KEY SET — Chat and Agent features will return fallback responses. "
            f"Set {settings.llm_provider.upper()}_API_KEY in your .env file.",
            provider=settings.llm_provider,
        )


    log.info("nexusai.startup", env=settings.environment)
    yield

    # Shutdown
    from app.core.redis import close_redis
    await close_redis()
    from app.ai.reranker import shutdown_executor
    shutdown_executor()


def create_app() -> FastAPI:
    ensure_storage_dirs()
    app = FastAPI(
        title="NexusAI API",
        description="Multi-Agent RAG Platform",
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.add_middleware(
        GZipMiddleware,
        minimum_size=1000,
    )

    app.mount(
        settings.static_mount_path,
        StaticFiles(directory=settings.static_dir),
        name="static",
    )

    # Register global exception handlers for absolute fault tolerance
    from app.core.exceptions import register_exception_handlers
    register_exception_handlers(app)

    # Register all routers
    from app.api.auth import router as auth_router
    from app.api.documents import router as docs_router
    from app.api.chat import router as chat_router
    from app.api.agents import router as agents_router
    from app.api.analytics import router as analytics_router
    from app.api.support import router as support_router
    from app.api.workspaces import router as workspaces_router
    from app.api.billing import router as billing_router
    from app.api.integrations import router as integrations_router
    from app.api.dashboard import router as dashboard_router
    from app.api.keys import router as keys_router
    from app.api.two_factor import router as two_factor_router
    from app.modules.agents.enhanced_api import router as modules_router

    prefix = "/api"
    app.include_router(auth_router, prefix=prefix)
    app.include_router(docs_router, prefix=prefix)
    app.include_router(chat_router, prefix=prefix)
    app.include_router(agents_router, prefix=prefix)
    app.include_router(analytics_router, prefix=prefix)
    app.include_router(support_router, prefix=prefix)
    app.include_router(workspaces_router, prefix=prefix)
    app.include_router(billing_router, prefix=prefix)
    app.include_router(integrations_router, prefix=prefix)
    app.include_router(dashboard_router, prefix=prefix)
    app.include_router(keys_router, prefix=prefix)
    app.include_router(two_factor_router, prefix=prefix)
    app.include_router(modules_router)

    @app.get("/health", tags=["ops"])
    async def health():
        return {"status": "ok", "version": "0.1.0", "env": settings.environment}

    return app

app = create_app()
