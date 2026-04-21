from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.exceptions import AppError
from fastapi import status

from src.models import Driver, Movement, Trip
from src.notifications.service import (
    acknowledge_all_for_movement,
    ensure_pending_evidence_notifications_for_movement,
)
from src.whatsapp import (
    send_approval_notice,
    send_rejection_notice,
    send_trip_started_notice,
)


def _to_float(v) -> float:
    try:
        return float(v)
    except Exception:
        return 0.0


async def create_trip(session: AsyncSession, *, company_id: UUID, data: dict) -> dict:
    driver_id = UUID(data["driver_id"])

    result = await session.execute(
        select(Driver).where(Driver.id == driver_id, Driver.company_id == company_id)
    )
    driver = result.scalar_one_or_none()
    if not driver:
        raise AppError("Operador inválido", status_code=status.HTTP_400_BAD_REQUEST)

    start_dt = datetime.combine(data["load_date"], data["load_time"]).replace(
        tzinfo=timezone.utc
    )

    trip = Trip(
        company_id=company_id,
        driver_id=driver_id,
        origin_name=data["origin_name"],
        destination_name=data["destination_name"],
        load_date=data["load_date"],
        load_time=data["load_time"],
        folio=data.get("folio"),
        load_company=data.get("load_company"),
        delivery_client=data.get("delivery_client"),
        unit_type=data.get("unit_type"),
        truck=data.get("truck"),
        trailer=data.get("trailer"),
        start_date=start_dt,
        status="in_progress",
        total_income=0,
        total_expense=0,
    )
    session.add(trip)
    await session.flush()

    if driver.whatsapp_phone:
        await send_trip_started_notice(
            to=driver.whatsapp_phone,
            driver_name=driver.name,
            folio=trip.folio,
            origin=trip.origin_name,
            destination=trip.destination_name,
            client=trip.delivery_client,
        )

    return {
        "id": str(trip.id),
        "driver_id": str(trip.driver_id),
        "folio": trip.folio,
        "origin_name": trip.origin_name,
        "destination_name": trip.destination_name,
        "load_date": trip.load_date,
        "load_time": trip.load_time,
        "load_company": trip.load_company,
        "delivery_client": trip.delivery_client,
        "unit_type": trip.unit_type,
        "truck": trip.truck,
        "trailer": trip.trailer,
        "start_date": trip.start_date,
        "end_date": trip.end_date,
        "status": trip.status,
        "notes": trip.notes,
        "total_income": _to_float(trip.total_income),
        "total_expense": _to_float(trip.total_expense),
    }


async def update_trip(
    session: AsyncSession, *, company_id: UUID, trip_id: UUID, data: dict
) -> dict:
    result = await session.execute(
        select(Trip).where(Trip.id == trip_id, Trip.company_id == company_id)
    )
    trip = result.scalar_one_or_none()
    if not trip:
        raise AppError("trip not found", status_code=status.HTTP_404_NOT_FOUND)
    if data.get("status") is not None:
        trip.status = data["status"]
    if data.get("notes") is not None:
        trip.notes = data["notes"]
    if data.get("total_income") is not None:
        trip.total_income = _to_float(data["total_income"])
    if data.get("total_expense") is not None:
        trip.total_expense = _to_float(data["total_expense"])

    await session.flush()

    return {
        "id": str(trip.id),
        "driver_id": str(trip.driver_id),
        "folio": trip.folio,
        "origin_name": trip.origin_name,
        "destination_name": trip.destination_name,
        "load_date": trip.load_date,
        "load_time": trip.load_time,
        "load_company": trip.load_company,
        "delivery_client": trip.delivery_client,
        "unit_type": trip.unit_type,
        "truck": trip.truck,
        "trailer": trip.trailer,
        "start_date": trip.start_date,
        "end_date": trip.end_date,
        "status": trip.status,
        "notes": trip.notes,
        "total_income": _to_float(trip.total_income),
        "total_expense": _to_float(trip.total_expense),
    }


async def list_trips(
    session: AsyncSession,
    *,
    company_id: UUID,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    driver_id: UUID | None = None,
    status_filter: str | None = None,
) -> list[dict]:
    q = select(Trip).where(Trip.company_id == company_id)
    if status_filter:
        q = q.where(Trip.status == status_filter)
    if driver_id:
        q = q.where(Trip.driver_id == driver_id)
    if start_date:
        q = q.where(Trip.start_date >= start_date)
    if end_date:
        q = q.where(Trip.start_date <= end_date)
    q = q.order_by(Trip.start_date.desc())

    result = await session.execute(q)
    trips = result.scalars().all()
    return [
        {
            "id": str(t.id),
            "driver_id": str(t.driver_id),
            "folio": t.folio,
            "origin_name": t.origin_name,
            "destination_name": t.destination_name,
            "load_date": t.load_date,
            "load_time": t.load_time,
            "load_company": t.load_company,
            "delivery_client": t.delivery_client,
            "unit_type": t.unit_type,
            "truck": t.truck,
            "trailer": t.trailer,
            "start_date": t.start_date,
            "end_date": t.end_date,
            "status": t.status,
            "notes": t.notes,
            "total_income": _to_float(t.total_income),
            "total_expense": _to_float(t.total_expense),
        }
        for t in trips
    ]


async def add_movement(
    session: AsyncSession, *, company_id: UUID, trip_id: UUID, data: dict
) -> dict:
    result = await session.execute(
        select(Trip).where(Trip.id == trip_id, Trip.company_id == company_id)
    )
    trip = result.scalar_one_or_none()
    if not trip:
        raise AppError("Viaje no encontrado", status_code=status.HTTP_404_NOT_FOUND)
    if trip.status == "closed":
        raise AppError(
            "No se pueden agregar movimientos a un viaje cerrado",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    movement = Movement(
        trip_id=trip.id,
        type=data["type"],
        concept=data["concept"],
        amount=data["amount"],
        currency=data.get("currency", "MXN"),
        movement_date=data["movement_date"],
        evidence_url=data.get("evidence_url"),
        evidence_type=data.get("evidence_type"),
    )
    session.add(movement)

    if data["type"] == "income":
        trip.total_income = _to_float(trip.total_income) + data["amount"]
    else:
        trip.total_expense = _to_float(trip.total_expense) + data["amount"]

    await session.flush()

    await ensure_pending_evidence_notifications_for_movement(
        session,
        company_id=company_id,
        trip_id=trip.id,
        movement=movement,
    )

    return {
        "id": str(movement.id),
        "type": movement.type,
        "concept": movement.concept,
        "amount": _to_float(movement.amount),
        "currency": movement.currency,
        "movement_date": movement.movement_date,
        "evidence_url": movement.evidence_url,
        "evidence_type": movement.evidence_type,
        "evidence_status": movement.evidence_status,
        "rejection_reason": movement.rejection_reason,
        "rejected_at": movement.rejected_at,
    }


async def _get_driver_for_trip(session: AsyncSession, trip: Trip) -> Driver | None:
    result = await session.execute(
        select(Driver).where(Driver.id == trip.driver_id)
    )
    return result.scalar_one_or_none()


async def approve_movement(
    session: AsyncSession,
    *,
    company_id: UUID,
    trip_id: UUID,
    movement_id: UUID,
    concept: str | None = None,
    amount: float | None = None,
) -> dict:
    result = await session.execute(
        select(Trip).where(Trip.id == trip_id, Trip.company_id == company_id)
    )
    trip = result.scalar_one_or_none()
    if not trip:
        raise AppError("trip not found", status_code=status.HTTP_404_NOT_FOUND)

    result = await session.execute(
        select(Movement).where(Movement.id == movement_id, Movement.trip_id == trip_id)
    )
    movement = result.scalar_one_or_none()
    if not movement:
        raise AppError(
            "Movimiento no encontrado", status_code=status.HTTP_404_NOT_FOUND
        )

    if concept is not None:
        movement.concept = concept

    if amount is not None:
        delta = amount - _to_float(movement.amount)
        movement.amount = amount
        if movement.type == "income":
            trip.total_income = _to_float(trip.total_income) + delta
        else:
            trip.total_expense = _to_float(trip.total_expense) + delta

    movement.evidence_status = "approved"

    await session.flush()

    await acknowledge_all_for_movement(
        session, company_id=company_id, movement_id=movement_id
    )

    driver = await _get_driver_for_trip(session, trip)
    if driver and driver.whatsapp_phone:
        await send_approval_notice(
            to=driver.whatsapp_phone,
            driver_name=driver.name,
            concept=movement.concept,
            amount=_to_float(movement.amount),
            folio=trip.folio,
        )

    return {
        "id": str(movement.id),
        "type": movement.type,
        "concept": movement.concept,
        "amount": _to_float(movement.amount),
        "currency": movement.currency,
        "movement_date": movement.movement_date,
        "evidence_url": movement.evidence_url,
        "evidence_type": movement.evidence_type,
        "evidence_status": movement.evidence_status,
    }


async def reject_movement(
    session: AsyncSession,
    *,
    company_id: UUID,
    trip_id: UUID,
    movement_id: UUID,
    rejection_reason: str,
    notify_whatsapp: bool = False,
) -> dict:
    result = await session.execute(
        select(Trip).where(Trip.id == trip_id, Trip.company_id == company_id)
    )
    trip = result.scalar_one_or_none()
    if not trip:
        raise AppError("Viaje no encontrado", status_code=status.HTTP_404_NOT_FOUND)

    result = await session.execute(
        select(Movement).where(Movement.id == movement_id, Movement.trip_id == trip_id)
    )
    movement = result.scalar_one_or_none()
    if not movement:
        raise AppError(
            "Movimiento no encontrado", status_code=status.HTTP_404_NOT_FOUND
        )

    movement.evidence_status = "rejected"
    movement.rejection_reason = rejection_reason
    movement.rejected_at = datetime.now(timezone.utc)

    await session.flush()

    await acknowledge_all_for_movement(
        session, company_id=company_id, movement_id=movement_id
    )

    if notify_whatsapp:
        driver = await _get_driver_for_trip(session, trip)
        if driver and driver.whatsapp_phone:
            await send_rejection_notice(
                to=driver.whatsapp_phone,
                driver_name=driver.name,
                concept=movement.concept,
                amount=_to_float(movement.amount),
                reason=rejection_reason,
                folio=trip.folio,
            )

    return {
        "id": str(movement.id),
        "type": movement.type,
        "concept": movement.concept,
        "amount": _to_float(movement.amount),
        "currency": movement.currency,
        "movement_date": movement.movement_date,
        "evidence_url": movement.evidence_url,
        "evidence_type": movement.evidence_type,
        "evidence_status": movement.evidence_status,
        "rejection_reason": movement.rejection_reason,
        "rejected_at": movement.rejected_at,
    }


async def get_trip_detail(
    session: AsyncSession, *, company_id: UUID, trip_id: UUID
) -> dict:
    result = await session.execute(
        select(Trip).where(Trip.id == trip_id, Trip.company_id == company_id)
    )
    trip = result.scalar_one_or_none()
    if not trip:
        raise AppError("Viaje no encontrado", status_code=status.HTTP_404_NOT_FOUND)

    result = await session.execute(select(Movement).where(Movement.trip_id == trip.id))
    movements = result.scalars().all()

    return {
        "id": str(trip.id),
        "driver_id": str(trip.driver_id),
        "folio": trip.folio,
        "origin_name": trip.origin_name,
        "destination_name": trip.destination_name,
        "load_date": trip.load_date,
        "load_time": trip.load_time,
        "load_company": trip.load_company,
        "delivery_client": trip.delivery_client,
        "unit_type": trip.unit_type,
        "truck": trip.truck,
        "trailer": trip.trailer,
        "start_date": trip.start_date,
        "end_date": trip.end_date,
        "status": trip.status,
        "notes": trip.notes,
        "total_income": _to_float(trip.total_income),
        "total_expense": _to_float(trip.total_expense),
        "movements": [
            {
                "id": str(m.id),
                "type": m.type,
                "concept": m.concept,
                "amount": _to_float(m.amount),
                "currency": m.currency,
                "movement_date": m.movement_date,
                "evidence_url": m.evidence_url,
                "evidence_type": m.evidence_type,
                "evidence_status": m.evidence_status,
                "rejection_reason": m.rejection_reason,
                "rejected_at": m.rejected_at,
            }
            for m in movements
        ],
    }
