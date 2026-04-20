"""Add notes field to trip table.

Revision ID: 20260420_001
Revises: 20260414_001
Create Date: 2026-04-20

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20260420_001"
down_revision: Union[str, None] = "20260414_001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("trip", sa.Column("notes", sa.String(length=2048), nullable=True))


def downgrade() -> None:
    op.drop_column("trip", "notes")
