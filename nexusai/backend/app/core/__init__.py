from app.core.config import settings

__all__ = [
    "settings",
    "get_db",
    "get_client",
    "get_database",
    "init_indexes",
    "get_redis",
    "get_redis_pool",
]


def __getattr__(name: str):
    if name in {"get_db", "get_client", "get_database", "init_indexes"}:
        from app.core.database import get_db, get_client, get_database, init_indexes

        return {
            "get_db": get_db,
            "get_client": get_client,
            "get_database": get_database,
            "init_indexes": init_indexes,
        }[name]
    if name in {"get_redis", "get_redis_pool"}:
        from app.core.redis import get_redis, get_redis_pool

        return {
            "get_redis": get_redis,
            "get_redis_pool": get_redis_pool,
        }[name]
    raise AttributeError(f"module 'app.core' has no attribute {name!r}")
