"""Add load fields to trip (nuevo viaje form).

Revision ID: 20250221_002
Revises: 20250221_001
Create Date: 2025-02-21

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20250221_002"
down_revision: Union[str, None] = "20250221_001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("trip", sa.Column("load_date", sa.Date(), nullable=True))
    op.add_column("trip", sa.Column("load_time", sa.Time(), nullable=True))
    op.add_column("trip", sa.Column("folio", sa.String(length=128), nullable=True))
    op.add_column("trip", sa.Column("load_company", sa.String(length=255), nullable=True))
    op.add_column("trip", sa.Column("delivery_client", sa.String(length=255), nullable=True))
    op.add_column("trip", sa.Column("unit_type", sa.String(length=128), nullable=True))
    op.add_column("trip", sa.Column("truck", sa.String(length=128), nullable=True))
    op.add_column("trip", sa.Column("trailer", sa.String(length=128), nullable=True))


def downgrade() -> None:
    op.drop_column("trip", "trailer")
    op.drop_column("trip", "truck")
    op.drop_column("trip", "unit_type")
    op.drop_column("trip", "delivery_client")
    op.drop_column("trip", "load_company")
    op.drop_column("trip", "folio")
    op.drop_column("trip", "load_time")
    op.drop_column("trip", "load_date")

