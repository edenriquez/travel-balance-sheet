"""Initial schema: company, user, company_member, driver, trip, movement, whatsapp_session.

Revision ID: 20250220_001
Revises:
Create Date: 2025-02-20

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "20250220_001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "company",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(128), nullable=False),
        sa.Column("settings", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.PrimaryKeyConstraint("id", name=op.f("company_pkey")),
    )
    op.create_index("slug_idx", "company", ["slug"], unique=True)

    op.create_table(
        "user",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.PrimaryKeyConstraint("id", name=op.f("user_pkey")),
    )
    op.create_index("email_idx", "user", ["email"], unique=True)

    op.create_table(
        "company_member",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("role", sa.String(32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["company_id"], ["company.id"], name=op.f("company_member_company_id_fkey"), ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"], name=op.f("company_member_user_id_fkey"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("company_member_pkey")),
        sa.UniqueConstraint("company_id", "user_id", name=op.f("company_member_company_id_user_id_key")),
    )
    op.create_index("company_member_company_id_idx", "company_member", ["company_id"], unique=False)

    op.create_table(
        "driver",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("whatsapp_phone", sa.String(32), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["company_id"], ["company.id"], name=op.f("driver_company_id_fkey"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("driver_pkey")),
        sa.UniqueConstraint("company_id", "whatsapp_phone", name=op.f("driver_company_id_whatsapp_phone_key")),
    )
    op.create_index("driver_company_id_idx", "driver", ["company_id"], unique=False)

    op.create_table(
        "trip",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("driver_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("origin_name", sa.String(512), nullable=False),
        sa.Column("destination_name", sa.String(512), nullable=False),
        sa.Column("lat_origin", sa.Numeric(10, 7), nullable=True),
        sa.Column("lng_origin", sa.Numeric(10, 7), nullable=True),
        sa.Column("lat_destiny", sa.Numeric(10, 7), nullable=True),
        sa.Column("lng_destiny", sa.Numeric(10, 7), nullable=True),
        sa.Column("start_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(32), nullable=False, server_default=sa.text("'in_progress'")),
        sa.Column("total_income", sa.Numeric(14, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("total_expense", sa.Numeric(14, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["company_id"], ["company.id"], name=op.f("trip_company_id_fkey"), ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["driver_id"], ["driver.id"], name=op.f("trip_driver_id_fkey"), ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id", name=op.f("trip_pkey")),
    )
    op.create_index("trip_company_id_idx", "trip", ["company_id"], unique=False)
    op.create_index("trip_driver_id_idx", "trip", ["driver_id"], unique=False)

    op.create_table(
        "movement",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("trip_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("type", sa.String(32), nullable=False),
        sa.Column("concept", sa.String(512), nullable=False),
        sa.Column("amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("currency", sa.String(8), nullable=False, server_default=sa.text("'MXN'")),
        sa.Column("movement_date", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["trip_id"], ["trip.id"], name=op.f("movement_trip_id_fkey"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("movement_pkey")),
    )
    op.create_index("movement_trip_id_idx", "movement", ["trip_id"], unique=False)

    op.create_table(
        "whatsapp_session",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("whatsapp_phone", sa.String(32), nullable=False),
        sa.Column("last_command", sa.String(128), nullable=True),
        sa.Column("context_extra", postgresql.JSONB(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["company_id"], ["company.id"], name=op.f("whatsapp_session_company_id_fkey"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("whatsapp_session_pkey")),
    )
    op.create_index("whatsapp_session_company_id_idx", "whatsapp_session", ["company_id"], unique=False)


def downgrade() -> None:
    op.drop_index("whatsapp_session_company_id_idx", table_name="whatsapp_session")
    op.drop_table("whatsapp_session")
    op.drop_index("movement_trip_id_idx", table_name="movement")
    op.drop_table("movement")
    op.drop_index("trip_driver_id_idx", table_name="trip")
    op.drop_index("trip_company_id_idx", table_name="trip")
    op.drop_table("trip")
    op.drop_index("driver_company_id_idx", table_name="driver")
    op.drop_table("driver")
    op.drop_index("company_member_company_id_idx", table_name="company_member")
    op.drop_table("company_member")
    op.drop_index("email_idx", table_name="user")
    op.drop_table("user")
    op.drop_index("slug_idx", table_name="company")
    op.drop_table("company")
