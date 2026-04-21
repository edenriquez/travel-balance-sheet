"""Per-trip rollup notifications.

Revision ID: 20260421_002
Revises: 20260421_001
Create Date: 2026-04-21

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20260421_002"
down_revision: Union[str, None] = "20260421_001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint(
        "notification_movement_id_user_id_key", "notification", type_="unique"
    )
    op.alter_column("notification", "movement_id", nullable=True)
    op.create_index(
        "notification_trip_user_kind_unack_key",
        "notification",
        ["trip_id", "user_id", "kind"],
        unique=True,
        postgresql_where=sa.text("acknowledged_at IS NULL"),
    )


def downgrade() -> None:
    op.drop_index("notification_trip_user_kind_unack_key", table_name="notification")
    op.execute("DELETE FROM notification WHERE movement_id IS NULL")
    op.alter_column("notification", "movement_id", nullable=False)
    op.create_unique_constraint(
        "notification_movement_id_user_id_key",
        "notification",
        ["movement_id", "user_id"],
    )
