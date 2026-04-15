from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.dependencies import get_current_user
from src.database import get_db
from src.exceptions import AppError
from src.notifications.schemas import (
    NotificationAcknowledge,
    NotificationCreate,
    NotificationResponse,
)
from src.notifications.service import (
    acknowledge_notification,
    create_notifications_from_request,
    list_notifications_for_user,
)

router = APIRouter()


@router.get("", response_model=list[NotificationResponse])
async def get_notifications(
    unacknowledged_only: bool = Query(
        default=False,
        description="If true, only return notifications not yet acknowledged",
    ),
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    company_id = UUID(current_user["company_id"])
    user_id = UUID(current_user["user_id"])
    return await list_notifications_for_user(
        session,
        company_id=company_id,
        user_id=user_id,
        unacknowledged_only=unacknowledged_only,
    )


@router.post("", response_model=dict)
async def post_notification(
    body: NotificationCreate,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Create accountant notifications for a movement with pending evidence (idempotent)."""
    company_id = UUID(current_user["company_id"])
    created = await create_notifications_from_request(
        session,
        company_id=company_id,
        trip_id=UUID(body.trip_id),
        movement_id=UUID(body.movement_id),
    )
    return {"created": created}


@router.put("/{notification_id}", response_model=NotificationResponse)
async def put_notification_acknowledge(
    notification_id: str,
    body: NotificationAcknowledge = NotificationAcknowledge(),
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Mark a notification as acknowledged (e.g. after opening the trip or resolving from list)."""
    company_id = UUID(current_user["company_id"])
    user_id = UUID(current_user["user_id"])
    if not body.acknowledged:
        raise AppError(
            "Solo se admite acknowledged=true",
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    return await acknowledge_notification(
        session,
        company_id=company_id,
        user_id=user_id,
        notification_id=UUID(notification_id),
    )
