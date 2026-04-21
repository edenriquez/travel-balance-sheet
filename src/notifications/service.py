from datetime import datetime, timezone
from uuid import UUID

from fastapi import status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import settings
from src.exceptions import AppError
from src.models import CompanyMember, Movement, Notification, Trip


def _trip_detail_path(trip_id: UUID) -> str:
    base = settings.FRONTEND_URL.rstrip("/")
    return f"{base}/viaje/{trip_id}"


def _fmt_amount(amount) -> str:
    try:
        return f"{float(amount):,.2f}"
    except Exception:
        return str(amount)


async def refresh_pending_evidence_rollup(
    session: AsyncSession,
    *,
    company_id: UUID,
    trip_id: UUID,
) -> int:
    """Upsert one rollup notification per accountant summarizing pending movements on this trip.

    If count reaches 0, auto-acks the existing rollup. Returns number of rows touched.
    """
    result = await session.execute(
        select(CompanyMember.user_id).where(
            CompanyMember.company_id == company_id,
            CompanyMember.role == "accountant",
        )
    )
    accountant_ids = [row[0] for row in result.all()]
    if not accountant_ids:
        return 0

    count_result = await session.execute(
        select(func.count(Movement.id)).where(
            Movement.trip_id == trip_id,
            Movement.evidence_status == "pending",
        )
    )
    pending_count = int(count_result.scalar() or 0)

    trip_result = await session.execute(select(Trip).where(Trip.id == trip_id))
    trip = trip_result.scalar_one_or_none()
    if trip is None:
        return 0
    trip_label = f"{trip.origin_name} → {trip.destination_name}"
    if trip.folio:
        trip_label = f"{trip.folio} · {trip_label}"

    title = "Evidencias pendientes de revisión"
    plural = "s" if pending_count != 1 else ""
    body = (
        f"Viaje {trip_label}: {pending_count} gasto{plural} pendiente{plural} de revisión."
    )
    deep_link = _trip_detail_path(trip_id)

    now = datetime.now(timezone.utc)
    touched = 0
    for uid in accountant_ids:
        result = await session.execute(
            select(Notification).where(
                Notification.trip_id == trip_id,
                Notification.user_id == uid,
                Notification.kind == "pending_evidence",
                Notification.acknowledged_at.is_(None),
            )
        )
        existing = result.scalar_one_or_none()

        if pending_count == 0:
            if existing is not None:
                existing.acknowledged_at = now
                touched += 1
            continue

        if existing is not None:
            existing.title = title
            existing.body = body
            existing.deep_link = deep_link
            existing.movement_id = None
            touched += 1
        else:
            n = Notification(
                company_id=company_id,
                user_id=uid,
                trip_id=trip_id,
                movement_id=None,
                kind="pending_evidence",
                title=title,
                body=body,
                deep_link=deep_link,
            )
            session.add(n)
            touched += 1
    if touched:
        await session.flush()
    return touched


async def ensure_pending_evidence_notifications_for_movement(
    session: AsyncSession,
    *,
    company_id: UUID,
    trip_id: UUID,
    movement: Movement,
) -> None:
    """Back-compat shim: refresh the trip's rollup notification."""
    if not movement.evidence_url:
        return
    if movement.evidence_status != "pending":
        return
    await refresh_pending_evidence_rollup(
        session, company_id=company_id, trip_id=trip_id
    )


async def create_notifications_from_request(
    session: AsyncSession,
    *,
    company_id: UUID,
    trip_id: UUID,
    movement_id: UUID,
) -> int:
    """Validate movement and create notifications (idempotent per accountant)."""
    result = await session.execute(
        select(Trip).where(Trip.id == trip_id, Trip.company_id == company_id)
    )
    trip = result.scalar_one_or_none()
    if not trip:
        raise AppError("Viaje no encontrado", status_code=status.HTTP_404_NOT_FOUND)

    result = await session.execute(
        select(Movement).where(
            Movement.id == movement_id,
            Movement.trip_id == trip_id,
        )
    )
    movement = result.scalar_one_or_none()
    if not movement:
        raise AppError("Movimiento no encontrado", status_code=status.HTTP_404_NOT_FOUND)

    if not movement.evidence_url:
        raise AppError(
            "El movimiento no tiene evidencia",
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    if movement.evidence_status != "pending":
        raise AppError(
            "Solo aplica a movimientos con evidencia pendiente",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    return await refresh_pending_evidence_rollup(
        session, company_id=company_id, trip_id=trip_id
    )


async def list_notifications_for_user(
    session: AsyncSession,
    *,
    company_id: UUID,
    user_id: UUID,
    unacknowledged_only: bool = False,
) -> list[dict]:
    stale_trips_result = await session.execute(
        select(Notification.trip_id)
        .where(
            Notification.company_id == company_id,
            Notification.user_id == user_id,
            Notification.kind == "pending_evidence",
            Notification.acknowledged_at.is_(None),
        )
        .distinct()
    )
    for (trip_id,) in stale_trips_result.all():
        await refresh_pending_evidence_rollup(
            session, company_id=company_id, trip_id=trip_id
        )

    q = select(Notification).where(
        Notification.company_id == company_id,
        Notification.user_id == user_id,
    )
    if unacknowledged_only:
        q = q.where(Notification.acknowledged_at.is_(None))
    q = q.order_by(Notification.created_at.desc())

    result = await session.execute(q)
    rows = result.scalars().all()
    return [
        {
            "id": str(n.id),
            "company_id": str(n.company_id),
            "user_id": str(n.user_id),
            "trip_id": str(n.trip_id),
            "movement_id": str(n.movement_id),
            "kind": n.kind,
            "title": n.title,
            "body": n.body,
            "deep_link": n.deep_link,
            "acknowledged_at": n.acknowledged_at,
            "created_at": n.created_at,
        }
        for n in rows
    ]


async def acknowledge_notification(
    session: AsyncSession,
    *,
    company_id: UUID,
    user_id: UUID,
    notification_id: UUID,
) -> dict:
    result = await session.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.company_id == company_id,
            Notification.user_id == user_id,
        )
    )
    n = result.scalar_one_or_none()
    if not n:
        raise AppError("Notificación no encontrada", status_code=status.HTTP_404_NOT_FOUND)

    if n.acknowledged_at is None:
        n.acknowledged_at = datetime.now(timezone.utc)
        await session.flush()

    return {
        "id": str(n.id),
        "company_id": str(n.company_id),
        "user_id": str(n.user_id),
        "trip_id": str(n.trip_id),
        "movement_id": str(n.movement_id),
        "kind": n.kind,
        "title": n.title,
        "body": n.body,
        "deep_link": n.deep_link,
        "acknowledged_at": n.acknowledged_at,
        "created_at": n.created_at,
    }


async def acknowledge_all_for_movement(
    session: AsyncSession,
    *,
    company_id: UUID,
    movement_id: UUID,
) -> None:
    """After approve/reject, clear pending inbox rows for that movement."""
    result = await session.execute(
        select(Notification).where(
            Notification.company_id == company_id,
            Notification.movement_id == movement_id,
            Notification.acknowledged_at.is_(None),
        )
    )
    rows = result.scalars().all()
    if not rows:
        return
    now = datetime.now(timezone.utc)
    for n in rows:
        n.acknowledged_at = now
    await session.flush()
