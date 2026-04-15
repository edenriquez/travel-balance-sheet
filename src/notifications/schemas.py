from datetime import datetime

from pydantic import BaseModel, Field


class NotificationCreate(BaseModel):
    trip_id: str = Field(..., description="Trip that contains the movement")
    movement_id: str = Field(..., description="Movement pending evidence review")


class NotificationResponse(BaseModel):
    id: str
    company_id: str
    user_id: str
    trip_id: str
    movement_id: str
    kind: str
    title: str
    body: str | None = None
    deep_link: str
    acknowledged_at: datetime | None = None
    created_at: datetime


class NotificationAcknowledge(BaseModel):
    """Mark notification as seen/handled (optional body for forward compatibility)."""

    acknowledged: bool = True
