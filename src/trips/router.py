from datetime import datetime, date, time, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.dependencies import get_current_user
from src.database import get_db
from src.storage import get_evidence_url, upload_evidence
from src.trips.schemas import (
    MovementResponse,
    RejectMovement,
    TripCreate,
    TripDetailResponse,
    TripResponse,
    TripUpdate,
)
from src.trips.service import (
    add_movement,
    create_trip,
    get_trip_detail,
    list_trips,
    reject_movement,
    approve_movement,
    update_trip,
)

router = APIRouter()


@router.get("", response_model=list[TripResponse])
async def get_trips(
    start_date: str | None = Query(default=None, description="YYYY-MM-DD"),
    end_date: str | None = Query(default=None, description="YYYY-MM-DD"),
    driver_id: str | None = None,
    status: str | None = None,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    company_id = UUID(current_user["company_id"])

    start_dt = None
    end_dt = None
    if start_date:
        d = date.fromisoformat(start_date)
        start_dt = datetime.combine(d, time.min).replace(tzinfo=timezone.utc)
    if end_date:
        d = date.fromisoformat(end_date)
        end_dt = datetime.combine(d, time.max).replace(tzinfo=timezone.utc)

    driver_uuid = UUID(driver_id) if driver_id else None
    return await list_trips(
        session,
        company_id=company_id,
        start_date=start_dt,
        end_date=end_dt,
        driver_id=driver_uuid,
        status_filter=status,
    )


@router.post("", response_model=TripResponse)
async def post_trip(
    body: TripCreate,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    company_id = UUID(current_user["company_id"])
    return await create_trip(session, company_id=company_id, data=body.model_dump())


@router.put("/{trip_id}", response_model=TripResponse)
async def put_trip(
    trip_id: str,
    body: TripUpdate,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    company_id = UUID(current_user["company_id"])
    return await update_trip(
        session, company_id=company_id, trip_id=UUID(trip_id), data=body.model_dump()
    )


@router.post("/{trip_id}/movements", response_model=MovementResponse)
async def post_movement(
    trip_id: str,
    type: str = Form(...),
    concept: str = Form(...),
    amount: float = Form(..., gt=0),
    currency: str = Form("MXN"),
    movement_date: date = Form(...),
    evidence: UploadFile | None = File(None),
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    company_id = UUID(current_user["company_id"])

    evidence_url: str | None = None
    if evidence and evidence.filename:
        file_bytes = await evidence.read()
        object_key = await upload_evidence(file_bytes, evidence.content_type, trip_id)
        evidence_url = get_evidence_url(object_key)

    data = {
        "type": type,
        "concept": concept,
        "amount": amount,
        "currency": currency,
        "movement_date": movement_date,
        "evidence_url": evidence_url,
    }
    return await add_movement(
        session, company_id=company_id, trip_id=UUID(trip_id), data=data
    )


@router.patch(
    "/{trip_id}/movements/{movement_id}/reject", response_model=MovementResponse
)
async def reject_movement_endpoint(
    trip_id: str,
    movement_id: str,
    body: RejectMovement,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    company_id = UUID(current_user["company_id"])
    return await reject_movement(
        session,
        company_id=company_id,
        trip_id=UUID(trip_id),
        movement_id=UUID(movement_id),
        rejection_reason=body.rejection_reason,
        notify_whatsapp=body.notify_whatsapp,
    )


@router.patch(
    "/{trip_id}/movements/{movement_id}/approve", response_model=MovementResponse
)
async def approve_movement_endpoint(
    trip_id: str,
    movement_id: str,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    company_id = UUID(current_user["company_id"])
    return await approve_movement(
        session,
        company_id=company_id,
        trip_id=UUID(trip_id),
        movement_id=UUID(movement_id),
    )


@router.get("/{trip_id}", response_model=TripDetailResponse)
async def get_trip(
    trip_id: str,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    company_id = UUID(current_user["company_id"])
    return await get_trip_detail(session, company_id=company_id, trip_id=UUID(trip_id))
