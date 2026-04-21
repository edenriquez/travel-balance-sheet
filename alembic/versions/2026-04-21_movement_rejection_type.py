"""Add rejection_type to movement (soft | hard).

Revision ID: 20260421_003
Revises: 20260421_002
Create Date: 2026-04-21

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20260421_003"
down_revision: Union[str, None] = "20260421_002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "movement",
        sa.Column("rejection_type", sa.String(length=16), nullable=True),
    )
    op.execute(
        "UPDATE movement SET rejection_type = 'soft' WHERE evidence_status = 'rejected'"
    )


def downgrade() -> None:
    op.drop_column("movement", "rejection_type")
