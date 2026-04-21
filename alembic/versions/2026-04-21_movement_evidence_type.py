"""Add evidence_type to movement (image | audio).

Revision ID: 20260421_001
Revises: 20260420_001
Create Date: 2026-04-21

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20260421_001"
down_revision: Union[str, None] = "20260420_001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("movement", sa.Column("evidence_type", sa.String(length=16), nullable=True))


def downgrade() -> None:
    op.drop_column("movement", "evidence_type")
