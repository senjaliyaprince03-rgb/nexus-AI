"""
Database Integration Layer

Provides unified access to the canonical MongoDB storage layer used by
the active NexusAI backend.
"""

import logging
from abc import ABC, abstractmethod
from typing import Any

logger = logging.getLogger(__name__)


class DatabaseInterface(ABC):
    """Abstract base class for database operations"""

    @abstractmethod
    async def query(self, collection: str, query: dict[str, Any]) -> list[dict[str, Any]]:
        """Execute a query against the database"""
        pass

    @abstractmethod
    async def insert(self, collection: str, document: dict[str, Any]) -> str:
        """Insert a document into the database"""
        pass

    @abstractmethod
    async def update(
        self,
        collection: str,
        filter: dict[str, Any],
        update: dict[str, Any],
    ) -> int:
        """Update documents in the database"""
        pass

    @abstractmethod
    async def delete(self, collection: str, filter: dict[str, Any]) -> int:
        """Delete documents from the database"""
        pass


class MongoDBIntegration(DatabaseInterface):
    """MongoDB integration using existing Motor client"""

    def __init__(self, database):
        self.db = database

    async def query(self, collection: str, query: dict[str, Any]) -> list[dict[str, Any]]:
        """Query MongoDB collection"""
        try:
            result = await self.db[collection].find(query).to_list(length=1000)
            return result
        except Exception as e:
            logger.error(f"MongoDB query error: {e}")
            raise

    async def insert(self, collection: str, document: dict[str, Any]) -> str:
        """Insert document into MongoDB"""
        try:
            result = await self.db[collection].insert_one(document)
            return str(result.inserted_id)
        except Exception as e:
            logger.error(f"MongoDB insert error: {e}")
            raise

    async def update(
        self,
        collection: str,
        filter: dict[str, Any],
        update: dict[str, Any],
    ) -> int:
        """Update documents in MongoDB"""
        try:
            result = await self.db[collection].update_many(filter, update)
            return result.modified_count
        except Exception as e:
            logger.error(f"MongoDB update error: {e}")
            raise

    async def delete(self, collection: str, filter: dict[str, Any]) -> int:
        """Delete documents from MongoDB"""
        try:
            result = await self.db[collection].delete_many(filter)
            return result.deleted_count
        except Exception as e:
            logger.error(f"MongoDB delete error: {e}")
            raise


class UnifiedDatabase:
    """MongoDB-only database interface kept for module compatibility."""

    def __init__(self, primary_db: DatabaseInterface):
        self.primary_db = primary_db
        self.default_backend = 'mongodb'

    def _ensure_mongo_backend(self, backend: str | None) -> None:
        if (backend or self.default_backend) != "mongodb":
            raise ValueError("NexusAI is MongoDB-only; non-MongoDB backends are not supported.")

    async def query(
        self,
        collection: str,
        query: dict[str, Any],
        backend: str | None = None,
    ) -> list[dict[str, Any]]:
        """Query the MongoDB collection."""
        self._ensure_mongo_backend(backend)
        return await self.primary_db.query(collection, query)

    async def insert(
        self,
        collection: str,
        document: dict[str, Any],
        backend: str | None = None,
    ) -> str:
        """Insert into MongoDB."""
        self._ensure_mongo_backend(backend)
        return await self.primary_db.insert(collection, document)

    async def update(
        self,
        collection: str,
        filter: dict[str, Any],
        update: dict[str, Any],
        backend: str | None = None,
    ) -> int:
        """Update MongoDB documents."""
        self._ensure_mongo_backend(backend)
        return await self.primary_db.update(collection, filter, update)

    async def delete(
        self,
        collection: str,
        filter: dict[str, Any],
        backend: str | None = None,
    ) -> int:
        """Delete MongoDB documents."""
        self._ensure_mongo_backend(backend)
        return await self.primary_db.delete(collection, filter)
