from __future__ import annotations

import asyncio
import os

from app.core.mongo import init_indexes, ping_database
from app.core.security import hash_password
from app.services.mongo_store import store


DEMO_PASSWORD = os.getenv("NEXUSAI_DEMO_PASSWORD", "demo-password")
DEMO_USERS = [
    ("demo@nexusai.local", "Demo Workspace"),
    ("analyst@nexusai.local", "Analyst Workspace"),
]


async def main() -> int:
    await ping_database()
    await init_indexes()

    created = 0
    existing = 0
    for email, workspace_name in DEMO_USERS:
        user = await store.get_user_by_email(email)
        if user:
            existing += 1
            continue
        await store.create_default_workspace_for_user(
            email=email,
            password_hash=hash_password(DEMO_PASSWORD),
            workspace_name=workspace_name,
            full_name=workspace_name,
        )
        created += 1

    print(f"seeded_created={created}")
    print(f"seeded_existing={existing}")
    print("demo_email=demo@nexusai.local")
    print("demo_password_source=NEXUSAI_DEMO_PASSWORD or default 'demo-password'")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
