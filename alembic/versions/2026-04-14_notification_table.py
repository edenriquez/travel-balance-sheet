"""notification table for accountant alerts (pending evidence).

Revision ID: 20260414_001
Revises: 20250223_002
Create Date: 2026-04-14

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "20260414_001"
down_revision: Union[str, None] = "20250223_002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "notification",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("trip_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("movement_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("kind", sa.String(length=64), nullable=False),
        sa.Column("title", sa.String(length=512), nullable=False),
        sa.Column("body", sa.String(length=2048), nullable=True),
        sa.Column("deep_link", sa.String(length=2048), nullable=False),
        sa.Column("acknowledged_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["company_id"], ["company.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["trip_id"], ["trip.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["movement_id"], ["movement.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("movement_id", "user_id", name="notification_movement_id_user_id_key"),
    )
    op.create_index("notification_company_id_user_id_idx", "notification", ["company_id", "user_id"])


def downgrade() -> None:
    op.drop_index("notification_company_id_user_id_idx", table_name="notification")
    op.drop_table("notification")
