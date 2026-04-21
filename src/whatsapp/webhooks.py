"""Public webhook endpoints (no auth) — called by Kapso."""

import json
import logging

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.whatsapp.service import handle_inbound_message, verify_signature

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/whatsapp")
async def whatsapp_webhook(
    request: Request,
    x_webhook_event: str | None = Header(default=None),
    x_webhook_signature: str | None = Header(default=None),
    session: AsyncSession = Depends(get_db),
):
    raw_body = await request.body()

    if not verify_signature(raw_body, x_webhook_signature):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid signature")

    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except json.JSONDecodeError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="invalid JSON")

    event = x_webhook_event or payload.get("event")
    if event != "whatsapp.message.received":
        logger.info("Ignoring webhook event: %s", event)
        return {"ok": True, "ignored": event}

    try:
        result = await handle_inbound_message(session, payload)
    except Exception as exc:
        import traceback
        print(
            f"[WA] Webhook processing failed: {type(exc).__name__}: {exc}\n"
            + traceback.format_exc(),
            flush=True,
        )
        logger.exception("Webhook processing failed: %s", exc)
        return {"ok": False, "error": str(exc)}

    return result
