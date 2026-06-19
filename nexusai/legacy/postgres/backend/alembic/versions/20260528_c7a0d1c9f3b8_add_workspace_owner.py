"""add workspace owner

Revision ID: c7a0d1c9f3b8
Revises: fcd471801094
Create Date: 2026-05-28 00:00:00.000000+00:00
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "c7a0d1c9f3b8"
down_revision: Union[str, None] = "fcd471801094"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("workspaces", sa.Column("owner_id", sa.UUID(), nullable=True))
    op.create_foreign_key(
        "fk_workspaces_owner_id_users",
        "workspaces",
        "users",
        ["owner_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_workspaces_owner_id_users", "workspaces", type_="foreignkey")
    op.drop_column("workspaces", "owner_id")
