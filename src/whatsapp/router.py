"""WhatsApp endpoints for testing and manual messaging."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from src.auth.dependencies import get_current_user
from src.whatsapp.client import send_text_message

router = APIRouter()


class SendTestMessage(BaseModel):
    to: str = Field(..., description="Recipient phone number, e.g. +525512345678")
    body: str = Field(..., min_length=1, max_length=4096)


@router.post("/send-test")
async def send_test(
    payload: SendTestMessage,
    current_user: dict = Depends(get_current_user),
):
    """Send a test WhatsApp message (admin only)."""
    result = await send_text_message(to=payload.to, body=payload.body)
    if result is None:
        return {"ok": False, "error": "Failed to send message or WhatsApp not configured"}
    return {"ok": True, "result": result}
