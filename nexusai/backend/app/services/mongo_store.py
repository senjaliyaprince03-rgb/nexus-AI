from __future__ import annotations

import hashlib
import math
import re
import uuid
from collections import Counter
from datetime import UTC, datetime, timedelta
from typing import Any

from bson import ObjectId
from pymongo.errors import DuplicateKeyError, PyMongoError
import structlog

from app.core.config import settings
from app.core.mongo import MongoOperationError, get_database, normalize_document, now_fields, to_object_id, utc_now


class NotFoundError(MongoOperationError):
    pass


class AccessDeniedError(MongoOperationError):
    pass


class ConfigurationError(MongoOperationError):
    pass


log = structlog.get_logger(__name__)


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9-]+", "-", value.lower().strip())
    slug = re.sub(r"-+", "-", slug).strip("-")
    return slug or "workspace"


def _clean_name(value: str, fallback: str) -> str:
    cleaned = value.strip()
    return cleaned or fallback


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _public_id(value: ObjectId | str | None) -> str | None:
    if value is None:
        return None
    return str(value)


def _embedding_vector(values: list[float]) -> list[float]:
    return [float(v) for v in values]


def _cosine_similarity(left: list[float], right: list[float]) -> float:
    if len(left) != len(right) or not left:
        return 0.0
    numerator = sum(a * b for a, b in zip(left, right, strict=False))
    left_norm = math.sqrt(sum(a * a for a in left))
    right_norm = math.sqrt(sum(b * b for b in right))
    if not left_norm or not right_norm:
        return 0.0
    return numerator / (left_norm * right_norm)


class MongoStore:
    @property
    def db(self):
        return get_database()

    @property
    def users(self):
        return self.db.users

    @property
    def workspaces(self):
        return self.db.workspaces

    @property
    def workspace_members(self):
        return self.db.workspace_members

    @property
    def documents(self):
        return self.db.documents

    @property
    def document_chunks(self):
        return self.db.document_chunks

    @property
    def chat_sessions(self):
        return self.db.chat_sessions

    @property
    def chat_messages(self):
        return self.db.chat_messages

    @property
    def agent_runs(self):
        return self.db.agent_runs

    @property
    def analytics_events(self):
        return self.db.analytics_events

    @property
    def refresh_tokens(self):
        return self.db.refresh_tokens

    @property
    def api_keys(self):
        return self.db.api_keys

    async def create_default_workspace_for_user(
        self,
        *,
        email: str,
        password_hash: str,
        workspace_name: str | None = None,
        full_name: str | None = None,
    ) -> tuple[dict[str, Any], dict[str, Any]]:
        normalized_email = _normalize_email(email)
        existing = await self.users.find_one({"email": normalized_email})
        if existing:
            raise ValueError("Email already registered")

        name = _clean_name(workspace_name or normalized_email.split("@", 1)[0], "My workspace")
        slug_base = _slugify(name)
        user_id = ObjectId()
        workspace_id = ObjectId()
        inserted: list[tuple[Any, ObjectId]] = []

        try:
            user_doc = {
                "_id": user_id,
                "email": normalized_email,
                "full_name": full_name.strip() if full_name else None,
                "password_hash": password_hash,
                "provider_id": None,
                "role": "user",
                "is_active": True,
                "is_verified": False,
                "default_workspace_id": workspace_id,
                "active_workspace_id": workspace_id,
                "created_at": utc_now(),
                "updated_at": utc_now(),
            }
            await self.users.insert_one(user_doc)
            inserted.append((self.users, user_id))

            workspace_doc = {
                "_id": workspace_id,
                "name": name,
                "slug": await self._unique_workspace_slug(slug_base),
                "owner_id": user_id,
                "plan": "free",
                "created_at": utc_now(),
                "updated_at": utc_now(),
            }
            await self.workspaces.insert_one(workspace_doc)
            inserted.append((self.workspaces, workspace_id))

            membership_doc = {
                "_id": ObjectId(),
                "workspace_id": workspace_id,
                "user_id": user_id,
                "role": "owner",
                "created_at": utc_now(),
                "updated_at": utc_now(),
            }
            await self.workspace_members.insert_one(membership_doc)
            inserted.append((self.workspace_members, membership_doc["_id"]))

            await self.users.update_one(
                {"_id": user_id},
                {
                    "$set": {
                        "default_workspace_id": workspace_id,
                        "active_workspace_id": workspace_id,
                        "updated_at": utc_now(),
                    }
                },
            )
            user_doc["default_workspace_id"] = workspace_id
            user_doc["active_workspace_id"] = workspace_id
            user_doc = await self.users.find_one({"_id": user_id})
            workspace_doc = await self.workspaces.find_one({"_id": workspace_id})
            if not user_doc or not workspace_doc:
                raise MongoOperationError("Workspace creation failed")
            return user_doc, workspace_doc
        except Exception:
            for collection, doc_id in reversed(inserted):
                try:
                    await collection.delete_one({"_id": doc_id})
                except Exception as rollback_exc:
                    log.error("workspace.creation_rollback_failed", doc_id=str(doc_id), error=str(rollback_exc))
            raise

    async def _unique_workspace_slug(self, base_slug: str) -> str:
        slug = base_slug
        for attempt in range(10):
            existing = await self.workspaces.find_one({"slug": slug})
            if not existing:
                return slug
            slug = f"{base_slug}-{attempt + 1}"
        raise ValueError("Could not generate a unique workspace slug")

    async def create_workspace(
        self,
        *,
        owner_id: str | ObjectId,
        name: str,
        plan: str = "free",
        member_role: str = "owner",
    ) -> dict[str, Any]:
        cleaned_name = _clean_name(name, "My workspace")
        owner_oid = to_object_id(owner_id)
        workspace = {
            "_id": ObjectId(),
            "name": cleaned_name,
            "slug": await self._unique_workspace_slug(_slugify(cleaned_name)),
            "owner_id": owner_oid,
            "plan": plan,
            **now_fields(),
        }
        await self.workspaces.insert_one(workspace)
        await self.workspace_members.insert_one(
            {
                "_id": ObjectId(),
                "workspace_id": workspace["_id"],
                "user_id": owner_oid,
                "role": member_role,
                **now_fields(),
            }
        )
        await self.update_user_workspace(owner_oid, workspace["_id"])
        return workspace

    async def get_user_by_email(self, email: str) -> dict[str, Any] | None:
        return await self.users.find_one({"email": _normalize_email(email)})

    async def get_user_by_id(self, user_id: str | ObjectId) -> dict[str, Any] | None:
        return await self.users.find_one({"_id": to_object_id(user_id)})

    async def update_user_profile(self, user_id: str | ObjectId, update_data: dict[str, Any]) -> dict[str, Any] | None:
        update_doc = {"$set": update_data}
        if "updated_at" not in update_data:
            update_data["updated_at"] = utc_now()
        await self.users.update_one({"_id": to_object_id(user_id)}, update_doc)
        return await self.get_user_by_id(user_id)

    async def update_user_password(self, user_id: str | ObjectId, password_hash: str) -> None:
        await self.users.update_one(
            {"_id": to_object_id(user_id)},
            {"$set": {"password_hash": password_hash, "updated_at": utc_now()}}
        )

    async def enable_totp(self, user_id: str | ObjectId, secret: str, backup_codes: list[str]) -> None:
        await self.users.update_one(
            {"_id": to_object_id(user_id)},
            {"$set": {
                "is_totp_enabled": True,
                "totp_secret": secret,
                "backup_codes": backup_codes,
                "updated_at": utc_now()
            }}
        )

    async def disable_totp(self, user_id: str | ObjectId) -> None:
        await self.users.update_one(
            {"_id": to_object_id(user_id)},
            {"$set": {
                "is_totp_enabled": False,
                "totp_secret": None,
                "backup_codes": [],
                "updated_at": utc_now()
            }}
        )

    async def get_workspace(self, workspace_id: str | ObjectId) -> dict[str, Any] | None:
        return await self.workspaces.find_one({"_id": to_object_id(workspace_id)})

    async def list_workspaces_for_user(self, user_id: str | ObjectId) -> list[dict[str, Any]]:
        oid = to_object_id(user_id)
        memberships = self.workspace_members.find({"user_id": oid})
        workspace_ids = [membership["workspace_id"] async for membership in memberships]
        if not workspace_ids:
            return []
        cursor = self.workspaces.find({"_id": {"$in": workspace_ids}}).sort("created_at", -1)
        return [workspace async for workspace in cursor]

    async def user_has_workspace_access(self, user_id: str | ObjectId, workspace_id: str | ObjectId) -> bool:
        oid_user = to_object_id(user_id)
        oid_workspace = to_object_id(workspace_id)
        membership = await self.workspace_members.find_one(
            {"user_id": oid_user, "workspace_id": oid_workspace}
        )
        if membership:
            return True
        workspace = await self.workspaces.find_one({"_id": oid_workspace, "owner_id": oid_user})
        return workspace is not None

    async def require_workspace_access(self, user_id: str | ObjectId, workspace_id: str | ObjectId) -> dict[str, Any]:
        workspace = await self.get_workspace(workspace_id)
        if not workspace:
            raise NotFoundError("Workspace not found")
        if not await self.user_has_workspace_access(user_id, workspace["_id"]):
            raise AccessDeniedError("Workspace access denied")
        return workspace

    async def ensure_owner_workspace(self, user_id: str | ObjectId, workspace_id: str | ObjectId) -> dict[str, Any]:
        workspace = await self.get_workspace(workspace_id)
        if not workspace:
            raise NotFoundError("Workspace not found")
        if workspace.get("owner_id") != to_object_id(user_id):
            raise AccessDeniedError("Workspace access denied")
        return workspace

    async def update_user_workspace(self, user_id: str | ObjectId, workspace_id: str | ObjectId) -> None:
        await self.users.update_one(
            {"_id": to_object_id(user_id)},
            {"$set": {"active_workspace_id": to_object_id(workspace_id), "default_workspace_id": to_object_id(workspace_id), "updated_at": utc_now()}},
        )

    async def create_refresh_token(self, user_id: str | ObjectId, workspace_id: str | ObjectId, token_id: str, expires_at: datetime) -> None:
        await self.refresh_tokens.update_one(
            {"token_id": token_id},
            {
                "$set": {
                    "token_id": token_id,
                    "user_id": to_object_id(user_id),
                    "workspace_id": to_object_id(workspace_id),
                    "expires_at": expires_at,
                    "revoked_at": None,
                    "created_at": utc_now(),
                    "updated_at": utc_now(),
                }
            },
            upsert=True,
        )

    async def revoke_refresh_token(self, token_id: str) -> None:
        await self.refresh_tokens.update_one(
            {"token_id": token_id},
            {"$set": {"revoked_at": utc_now(), "updated_at": utc_now()}},
        )

    async def is_refresh_token_valid(self, token_id: str, user_id: str | ObjectId | None = None) -> bool:
        doc = await self.refresh_tokens.find_one({"token_id": token_id})
        if not doc:
            return False
        if doc.get("revoked_at"):
            return False
        expires_at = doc.get("expires_at")
        if expires_at is not None:
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=UTC)
            if expires_at < utc_now():
                return False
        if user_id is not None and doc.get("user_id") != to_object_id(user_id):
            return False
        return True

    async def create_document(
        self,
        *,
        workspace_id: str | ObjectId,
        owner_id: str | ObjectId,
        filename: str,
        file_type: str,
        file_size_bytes: int,
        s3_key: str,
        metadata: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        payload = {
            "_id": ObjectId(),
            "workspace_id": to_object_id(workspace_id),
            "owner_id": to_object_id(owner_id),
            "filename": filename,
            "file_type": file_type,
            "status": "pending",
            "metadata": metadata or {},
            "file_size_bytes": file_size_bytes,
            "s3_key": s3_key,
            "chunk_count": 0,
            "error_message": None,
            "deleted_at": None,
            **now_fields(),
        }
        await self.documents.insert_one(payload)
        return payload

    async def get_document(self, document_id: str | ObjectId, workspace_id: str | ObjectId | None = None) -> dict[str, Any] | None:
        query: dict[str, Any] = {"_id": to_object_id(document_id), "deleted_at": None}
        if workspace_id is not None:
            query["workspace_id"] = to_object_id(workspace_id)
        return await self.documents.find_one(query)

    async def list_documents(
        self,
        *,
        workspace_id: str | ObjectId,
        page: int = 1,
        page_size: int = 20,
        search: str | None = None,
        status: str | None = None,
    ) -> dict[str, Any]:
        query: dict[str, Any] = {"workspace_id": to_object_id(workspace_id), "deleted_at": None}
        if search:
            query["filename"] = {"$regex": re.escape(search), "$options": "i"}
        if status:
            query["status"] = status
        total = await self.documents.count_documents(query)
        cursor = (
            self.documents.find(query)
            .sort("created_at", -1)
            .skip((page - 1) * page_size)
            .limit(page_size)
        )
        items = [doc async for doc in cursor]
        return {
            "items": [self.document_to_public(item) for item in items],
            "total": total,
            "page": page,
            "page_size": page_size,
            "has_next": (page * page_size) < total,
        }

    async def update_document_status(self, document_id: str | ObjectId, status: str, *, chunk_count: int | None = None, error_message: str | None = None) -> None:
        update: dict[str, Any] = {"status": status, "updated_at": utc_now()}
        if chunk_count is not None:
            update["chunk_count"] = chunk_count
        if error_message is not None:
            update["error_message"] = error_message
        await self.documents.update_one({"_id": to_object_id(document_id)}, {"$set": update})

    async def delete_document_chunks(self, document_id: str | ObjectId) -> None:
        await self.document_chunks.delete_many({"document_id": to_object_id(document_id)})

    async def soft_delete_document(self, document_id: str | ObjectId) -> None:
        await self.documents.update_one({"_id": to_object_id(document_id)}, {"$set": {"deleted_at": utc_now(), "updated_at": utc_now()}})
        await self.document_chunks.delete_many({"document_id": to_object_id(document_id)})

    async def insert_document_chunks(
        self,
        *,
        document_id: str | ObjectId,
        workspace_id: str | ObjectId,
        filename: str,
        chunks: list[dict[str, Any]],
        embeddings: list[list[float]],
    ) -> None:
        docs = []
        for chunk, embedding in zip(chunks, embeddings, strict=False):
            docs.append(
                {
                    "_id": ObjectId(),
                    "document_id": to_object_id(document_id),
                    "workspace_id": to_object_id(workspace_id),
                    "filename": filename,
                    "text": chunk["text"],
                    "content": chunk["text"],
                    "embedding": _embedding_vector(embedding),
                    "chunk_index": chunk["chunk_index"],
                    "metadata": chunk.get("metadata", {}),
                    "page_number": chunk.get("page_number"),
                    "created_at": utc_now(),
                    "updated_at": utc_now(),
                }
            )
        if docs:
            await self.document_chunks.insert_many(docs)
        await self.documents.update_one(
            {"_id": to_object_id(document_id)},
            {"$set": {"status": "ready", "chunk_count": len(docs), "error_message": None, "updated_at": utc_now()}},
        )

    async def fetch_retrieval_chunks(
        self,
        *,
        workspace_id: str | ObjectId,
        query_embedding: list[float],
        top_k: int,
    ) -> list[dict[str, Any]]:
        """
        Fetch vector chunks using either Atlas Vector Search or a local fallback.
        
        If using MongoDB Atlas Vector Search, you MUST configure a Search Index
        with the name configured in `settings.atlas_vector_search_index` (default: "vector_index").
        
        The JSON configuration for the index should look like this:
        {
          "fields": [
            {
              "type": "vector",
              "path": "embedding",
              "numDimensions": 1536,
              "similarity": "cosine"
            },
            {
              "type": "filter",
              "path": "workspace_id"
            },
            {
              "type": "filter",
              "path": "deleted_at"
            }
          ]
        }
        """
        if settings.atlas_vector_search_index:
            try:
                log.info(
                    "retrieval.vector_search",
                    mode="atlas",
                    index=settings.atlas_vector_search_index,
                    workspace_id=str(workspace_id),
                    top_k=top_k,
                )
                pipeline = [
                    {
                        "$vectorSearch": {
                            "index": settings.atlas_vector_search_index,
                            "path": "embedding",
                            "queryVector": query_embedding,
                            "numCandidates": max(20, top_k * 4),
                            "limit": top_k,
                            "filter": {
                                "workspace_id": to_object_id(workspace_id),
                                "deleted_at": None,
                            },
                        }
                    },
                    {
                        "$addFields": {
                            "score": {"$meta": "vectorSearchScore"},
                        }
                    },
                ]
                results = [doc async for doc in self.document_chunks.aggregate(pipeline)]
                return results
            except Exception as exc:
                if not settings.allow_local_vector_fallback:
                    raise ConfigurationError(
                        "MongoDB Atlas Vector Search is not available for this environment."
                    ) from exc
                log.warning(
                    "retrieval.vector_search_fallback",
                    reason="atlas_unavailable",
                    workspace_id=str(workspace_id),
                    top_k=top_k,
                )

        if not settings.allow_local_vector_fallback:
            raise ConfigurationError(
                "Vector retrieval is not configured. Set ATLAS_VECTOR_SEARCH_INDEX or ALLOW_LOCAL_VECTOR_FALLBACK=true."
            )

        log.info(
            "retrieval.vector_search",
            mode="local_cosine_fallback",
            workspace_id=str(workspace_id),
            top_k=top_k,
        )

        cursor = self.document_chunks.find(
            {"workspace_id": to_object_id(workspace_id)},
            projection={"embedding": 1, "text": 1, "content": 1, "filename": 1, "chunk_index": 1, "document_id": 1, "page_number": 1, "metadata": 1},
        )
        scored: list[tuple[float, dict[str, Any]]] = []
        async for chunk in cursor:
            score = _cosine_similarity(query_embedding, chunk.get("embedding", []))
            chunk["score"] = score
            scored.append((score, chunk))
        scored.sort(key=lambda item: item[0], reverse=True)
        if not scored:
            return []
        filtered = [chunk for score, chunk in scored if score >= settings.rag_min_score]
        if filtered:
            return filtered[:top_k]
        return [chunk for _, chunk in scored[:top_k]]

    async def create_chat_session(
        self,
        *,
        workspace_id: str | ObjectId,
        user_id: str | ObjectId,
        title: str,
        mode: str = "document",
        metadata: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        session = {
            "_id": ObjectId(),
            "workspace_id": to_object_id(workspace_id),
            "user_id": to_object_id(user_id),
            "title": title,
            "mode": mode,
            "metadata": metadata or {},
            **now_fields(),
        }
        await self.chat_sessions.insert_one(session)
        return session

    async def get_chat_session(self, session_id: str | ObjectId, *, workspace_id: str | ObjectId, user_id: str | ObjectId) -> dict[str, Any] | None:
        return await self.chat_sessions.find_one(
            {
                "_id": to_object_id(session_id),
                "workspace_id": to_object_id(workspace_id),
                "user_id": to_object_id(user_id),
            }
        )

    async def list_chat_sessions(self, *, workspace_id: str | ObjectId, user_id: str | ObjectId, limit: int = 50) -> list[dict[str, Any]]:
        cursor = (
            self.chat_sessions.find(
                {"workspace_id": to_object_id(workspace_id), "user_id": to_object_id(user_id)}
            )
            .sort("updated_at", -1)
            .limit(limit)
        )
        return [session async for session in cursor]

    async def append_chat_message(
        self,
        *,
        session_id: str | ObjectId,
        workspace_id: str | ObjectId,
        user_id: str | ObjectId,
        role: str,
        content: str,
        source_chunk_ids: list[str] | None = None,
        confidence_score: float | None = None,
        mode: str = "document",
        metadata: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        message = {
            "_id": ObjectId(),
            "session_id": to_object_id(session_id),
            "workspace_id": to_object_id(workspace_id),
            "user_id": to_object_id(user_id),
            "role": role,
            "content": content,
            "source_chunk_ids": source_chunk_ids or [],
            "confidence_score": confidence_score,
            "mode": mode,
            "metadata": metadata or {},
            "citations": [],
            "created_at": utc_now(),
        }
        await self.chat_messages.insert_one(message)
        await self.chat_sessions.update_one({"_id": to_object_id(session_id)}, {"$set": {"updated_at": utc_now()}})
        return message

    async def get_chat_messages(self, session_id: str | ObjectId) -> list[dict[str, Any]]:
        cursor = self.chat_messages.find({"session_id": to_object_id(session_id)}).sort("created_at", 1)
        return [message async for message in cursor]

    async def create_agent_run(
        self,
        *,
        workspace_id: str | ObjectId,
        user_id: str | ObjectId | None,
        agent_type: str,
        input_payload: dict[str, Any],
    ) -> dict[str, Any]:
        run = {
            "_id": ObjectId(),
            "workspace_id": to_object_id(workspace_id),
            "user_id": to_object_id(user_id) if user_id else None,
            "agent_type": agent_type,
            "input": input_payload,
            "output": None,
            "status": "queued",
            "confidence": None,
            "citations": [],
            "error": None,
            "steps": [],
            **now_fields(),
        }
        await self.agent_runs.insert_one(run)
        return run

    async def update_agent_run(
        self,
        run_id: str | ObjectId,
        *,
        status: str,
        output: dict[str, Any] | None = None,
        confidence: float | None = None,
        citations: list[dict[str, Any]] | None = None,
        error: str | None = None,
        steps: list[dict[str, Any]] | None = None,
    ) -> None:
        update: dict[str, Any] = {"status": status, "updated_at": utc_now()}
        if output is not None:
            update["output"] = output
        if confidence is not None:
            update["confidence"] = confidence
        if citations is not None:
            update["citations"] = citations
        if error is not None:
            update["error"] = error
        if steps is not None:
            update["steps"] = steps
        await self.agent_runs.update_one({"_id": to_object_id(run_id)}, {"$set": update})

    async def get_agent_run(self, run_id: str | ObjectId, *, workspace_id: str | ObjectId) -> dict[str, Any] | None:
        return await self.agent_runs.find_one({"_id": to_object_id(run_id), "workspace_id": to_object_id(workspace_id)})

    async def list_agent_runs(self, *, workspace_id: str | ObjectId, limit: int = 20) -> list[dict[str, Any]]:
        cursor = self.agent_runs.find({"workspace_id": to_object_id(workspace_id)}).sort("created_at", -1).limit(limit)
        return [run async for run in cursor]

    async def log_event(
        self,
        *,
        workspace_id: str | ObjectId,
        event_type: str,
        user_id: str | ObjectId | None = None,
        payload: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        event = {
            "_id": ObjectId(),
            "workspace_id": to_object_id(workspace_id),
            "user_id": to_object_id(user_id) if user_id else None,
            "event_type": event_type,
            "payload": payload or {},
            "created_at": utc_now(),
        }
        await self.analytics_events.insert_one(event)
        return event

    async def get_query_volume(self, *, workspace_id: str | ObjectId, days: int) -> list[dict[str, Any]]:
        since = utc_now() - timedelta(days=days)
        cursor = self.analytics_events.find(
            {
                "workspace_id": to_object_id(workspace_id),
                "event_type": "query",
                "created_at": {"$gte": since},
            }
        )
        counts: Counter[str] = Counter()
        async for event in cursor:
            counts[event["created_at"].strftime("%Y-%m-%d")] += 1
        output = []
        for offset in range(days):
            date = (utc_now() - timedelta(days=days - offset - 1)).strftime("%Y-%m-%d")
            output.append({"date": date, "count": counts.get(date, 0)})
        return output

    async def get_document_usage(self, *, workspace_id: str | ObjectId) -> list[dict[str, Any]]:
        cursor = self.chat_messages.find(
            {"workspace_id": to_object_id(workspace_id), "role": "assistant"},
            projection={"source_chunk_ids": 1},
        )
        chunk_counts: Counter[str] = Counter()
        async for message in cursor:
            for chunk_id in message.get("source_chunk_ids", []):
                chunk_counts[str(chunk_id)] += 1
        if not chunk_counts:
            return []
        chunk_ids = [to_object_id(chunk_id) for chunk_id in chunk_counts.keys()]
        chunk_cursor = self.document_chunks.find({"_id": {"$in": chunk_ids}}, projection={"document_id": 1})
        chunk_to_document: dict[str, str] = {}
        async for chunk in chunk_cursor:
            chunk_to_document[str(chunk["_id"])] = str(chunk["document_id"])
        document_counts: Counter[str] = Counter()
        for chunk_id, count in chunk_counts.items():
            document_id = chunk_to_document.get(chunk_id)
            if document_id:
                document_counts[document_id] += count
        if not document_counts:
            return []
        docs_cursor = self.documents.find({"_id": {"$in": [ObjectId(doc_id) for doc_id in document_counts.keys()]}})
        document_names: dict[str, str] = {}
        async for document in docs_cursor:
            document_names[str(document["_id"])] = document["filename"]
        return [
            {
                "document_id": document_id,
                "filename": document_names.get(document_id, "Unknown"),
                "query_hits": count,
            }
            for document_id, count in document_counts.most_common()
        ]

    def document_to_public(self, document: dict[str, Any]) -> dict[str, Any]:
        return {
            "id": str(document["_id"]),
            "filename": document["filename"],
            "status": document["status"],
            "chunk_count": document.get("chunk_count", 0),
            "file_size_bytes": document.get("file_size_bytes", 0),
            "content_type": document.get("file_type", "application/octet-stream"),
            "created_at": document["created_at"],
            "error_message": document.get("error_message"),
        }

    def user_to_public(self, user: dict[str, Any]) -> dict[str, Any]:
        return {
            "id": str(user["_id"]),
            "email": user["email"],
            "role": user.get("role", "user"),
            "workspace_id": _public_id(user.get("active_workspace_id") or user.get("default_workspace_id")),
            "default_workspace_id": _public_id(user.get("default_workspace_id")),
            "is_verified": bool(user.get("is_verified", False)),
            "is_active": bool(user.get("is_active", True)),
            "created_at": user["created_at"],
            "first_name": user.get("first_name"),
            "last_name": user.get("last_name"),
            "bio": user.get("bio"),
            "phone_number": user.get("phone_number"),
            "location": user.get("location"),
            "avatar_url": user.get("avatar_url"),
            "theme": user.get("theme"),
            "timezone": user.get("timezone"),
            "social_links": user.get("social_links"),
            "notification_preferences": user.get("notification_preferences"),
            "privacy_settings": user.get("privacy_settings"),
        }

    def workspace_to_public(self, workspace: dict[str, Any]) -> dict[str, Any]:
        return {
            "id": str(workspace["_id"]),
            "name": workspace["name"],
            "slug": workspace["slug"],
            "plan": workspace.get("plan", "free"),
            "owner_id": _public_id(workspace.get("owner_id")),
            "created_at": workspace["created_at"],
            "updated_at": workspace.get("updated_at"),
        }

    def chat_session_to_public(self, session: dict[str, Any], messages: list[dict[str, Any]] | None = None) -> dict[str, Any]:
        return {
            "id": str(session["_id"]),
            "title": session["title"],
            "workspace_id": str(session["workspace_id"]),
            "created_at": session["created_at"],
            "updated_at": session["updated_at"],
            "messages": [self.chat_message_to_public(message) for message in (messages or [])],
        }

    def chat_message_to_public(self, message: dict[str, Any]) -> dict[str, Any]:
        return {
            "id": str(message["_id"]),
            "role": message["role"],
            "content": message["content"],
            "source_chunk_ids": [str(value) for value in message.get("source_chunk_ids", [])],
            "confidence_score": message.get("confidence_score"),
            "created_at": message["created_at"],
        }

    def agent_run_to_public(self, run: dict[str, Any]) -> dict[str, Any]:
        return {
            "id": str(run["_id"]),
            "workspace_id": str(run["workspace_id"]),
            "user_id": _public_id(run.get("user_id")),
            "agent_type": run.get("agent_type", "rag"),
            "input": run.get("input", {}),
            "output": run.get("output"),
            "status": run["status"],
            "confidence": run.get("confidence"),
            "citations": run.get("citations", []),
            "error": run.get("error"),
            "created_at": run["created_at"],
            "updated_at": run["updated_at"],
        }

    async def create_api_key(self, workspace_id: ObjectId | str, user_id: ObjectId | str, name: str) -> tuple[str, dict[str, Any]]:
        import secrets
        import hashlib
        raw_key = f"nx_{secrets.token_urlsafe(32)}"
        hashed_key = hashlib.sha256(raw_key.encode()).hexdigest()
        
        doc = {
            "workspace_id": to_object_id(workspace_id),
            "created_by": to_object_id(user_id),
            "name": name.strip(),
            "hashed_key": hashed_key,
            "masked_key": f"{raw_key[:7]}...{raw_key[-4:]}",
            "is_active": True,
            "created_at": utc_now(),
        }
        await self.api_keys.insert_one(doc)
        return raw_key, normalize_document(doc)

    async def list_api_keys(self, workspace_id: ObjectId | str) -> list[dict[str, Any]]:
        cursor = self.api_keys.find({
            "workspace_id": to_object_id(workspace_id),
            "is_active": True
        }).sort("created_at", -1)
        keys = await cursor.to_list(length=100)
        return [normalize_document(k) for k in keys]

    async def get_api_key_record(self, raw_key: str) -> dict[str, Any] | None:
        import hashlib
        hashed_key = hashlib.sha256(raw_key.encode()).hexdigest()
        key_doc = await self.api_keys.find_one({"hashed_key": hashed_key, "is_active": True})
        if key_doc:
            return normalize_document(key_doc)
        return None

    async def revoke_api_key(self, key_id: ObjectId | str, workspace_id: ObjectId | str) -> bool:
        result = await self.api_keys.update_one(
            {"_id": to_object_id(key_id), "workspace_id": to_object_id(workspace_id)},
            {"$set": {"is_active": False}}
        )
        return result.modified_count > 0

store = MongoStore()
