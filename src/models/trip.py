"""Trip and movements tables."""

import uuid
from datetime import date, datetime, time
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Time
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.database import Base


class Trip(Base):
    __tablename__ = "trip"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("company.id", ondelete="CASCADE"), nullable=False
    )
    driver_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("driver.id", ondelete="RESTRICT"), nullable=False
    )
    origin_name: Mapped[str] = mapped_column(String(512), nullable=False)
    destination_name: Mapped[str] = mapped_column(String(512), nullable=False)
    load_date: Mapped[date | None] = mapped_column(Date, nullable=True)  # fecha de carga
    load_time: Mapped[time | None] = mapped_column(Time, nullable=True)  # hora de carga
    folio: Mapped[str | None] = mapped_column(String(128), nullable=True)
    load_company: Mapped[str | None] = mapped_column(String(255), nullable=True)  # empresa
    delivery_client: Mapped[str | None] = mapped_column(String(255), nullable=True)  # cliente de entrega
    unit_type: Mapped[str | None] = mapped_column(String(128), nullable=True)  # tipo de unidad
    truck: Mapped[str | None] = mapped_column(String(128), nullable=True)  # carro
    trailer: Mapped[str | None] = mapped_column(String(128), nullable=True)  # caja
    lat_origin: Mapped[float | None] = mapped_column(Numeric(10, 7), nullable=True)
    lng_origin: Mapped[float | None] = mapped_column(Numeric(10, 7), nullable=True)
    lat_destiny: Mapped[float | None] = mapped_column(Numeric(10, 7), nullable=True)
    lng_destiny: Mapped[float | None] = mapped_column(Numeric(10, 7), nullable=True)
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="in_progress")  # in_progress | closed
    notes: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    total_income: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0, nullable=False)
    total_expense: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )


class Movement(Base):
    __tablename__ = "movement"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    trip_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("trip.id", ondelete="CASCADE"), nullable=False
    )
    type: Mapped[str] = mapped_column(String(32), nullable=False)  # income | expense
    concept: Mapped[str] = mapped_column(String(512), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(8), default="MXN", nullable=False)
    movement_date: Mapped[date] = mapped_column(Date, nullable=False)
    evidence_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    evidence_type: Mapped[str | None] = mapped_column(String(16), nullable=True)  # image | audio
    evidence_status: Mapped[str] = mapped_column(String(32), default="pending", nullable=False)  # pending | approved | rejected
    rejection_reason: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    rejected_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
