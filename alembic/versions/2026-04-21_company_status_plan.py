"""Add status, plan, activated_at to company (onboarding lifecycle).

Revision ID: 20260421_004
Revises: 20260421_003
Create Date: 2026-04-21

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20260421_004"
down_revision: Union[str, None] = "20260421_003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "company",
        sa.Column("status", sa.String(length=32), nullable=False, server_default="active"),
    )
    op.add_column(
        "company",
        sa.Column("plan", sa.String(length=32), nullable=False, server_default="pyme"),
    )
    op.add_column(
        "company",
        sa.Column("activated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.execute("UPDATE company SET activated_at = created_at WHERE activated_at IS NULL")


def downgrade() -> None:
    op.drop_column("company", "activated_at")
    op.drop_column("company", "plan")
    op.drop_column("company", "status")
