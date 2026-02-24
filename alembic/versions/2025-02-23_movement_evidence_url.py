"""Add evidence_url to movement table.

Revision ID: 20250223_001
Revises: 20250221_002
Create Date: 2025-02-23

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20250223_001"
down_revision: Union[str, None] = "20250221_002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("movement", sa.Column("evidence_url", sa.String(length=1024), nullable=True))


def downgrade() -> None:
    op.drop_column("movement", "evidence_url")
