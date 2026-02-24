"""Add evidence_status, rejection_reason, rejected_at to movement.

Revision ID: 20250223_002
Revises: 20250223_001
Create Date: 2025-02-23

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20250223_002"
down_revision: Union[str, None] = "20250223_001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "movement",
        sa.Column("evidence_status", sa.String(length=32), nullable=False, server_default="pending"),
    )
    op.add_column(
        "movement",
        sa.Column("rejection_reason", sa.String(length=1024), nullable=True),
    )
    op.add_column(
        "movement",
        sa.Column("rejected_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("movement", "rejected_at")
    op.drop_column("movement", "rejection_reason")
    op.drop_column("movement", "evidence_status")
