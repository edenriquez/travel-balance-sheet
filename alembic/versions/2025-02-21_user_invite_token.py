"""Add user invite_token and invite_token_expires_at for set-password flow.

Revision ID: 20250221_001
Revises: 20250220_001
Create Date: 2025-02-21

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20250221_001"
down_revision: Union[str, None] = "20250220_001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("user", sa.Column("invite_token", sa.String(255), nullable=True))
    op.add_column("user", sa.Column("invite_token_expires_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("invite_token_idx", "user", ["invite_token"], unique=False)


def downgrade() -> None:
    op.drop_index("invite_token_idx", table_name="user")
    op.drop_column("user", "invite_token_expires_at")
    op.drop_column("user", "invite_token")
