"""Inbound WhatsApp webhook processing."""

import hashlib
import hmac
import json
import logging
import re
from datetime import date
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import settings
from src.models import Driver, Movement, Trip
from src.notifications.service import (
    create_pending_evidence_notifications,
    ensure_pending_evidence_notifications_for_movement,
)
from src.storage import (
    ALLOWED_AUDIO_TYPES,
    ALLOWED_CONTENT_TYPES,
    evidence_type_for_content,
    get_evidence_url,
    upload_evidence,
)
from src.trips.service import add_movement
from src.whatsapp.client import download_media, send_ack

logger = logging.getLogger(__name__)


def verify_signature(raw_body: bytes, signature_header: str | None) -> bool:
    """Verify HMAC-SHA256 signature of the raw webhook body."""
    if not settings.KAPSO_WEBHOOK_SECRET:
        logger.warning("KAPSO_WEBHOOK_SECRET not set; rejecting webhook")
        return False
    if not signature_header:
        logger.warning("Missing X-Webhook-Signature header; rejecting webhook")
        return False

    received = signature_header.strip()
    if received.lower().startswith("sha256="):
        received = received.split("=", 1)[1].strip()

    expected = hmac.new(
        settings.KAPSO_WEBHOOK_SECRET.encode("utf-8"),
        raw_body,
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected, received):
        logger.warning(
            "HMAC mismatch: received=%s... expected=%s... secret_len=%d body_len=%d",
            received[:12],
            expected[:12],
            len(settings.KAPSO_WEBHOOK_SECRET),
            len(raw_body),
        )
        return False
    return True


def _normalize_phone(phone: str | None) -> str:
    if not phone:
        return ""
    return re.sub(r"\D", "", phone)


async def _find_driver_by_phone(session: AsyncSession, phone: str) -> Driver | None:
    """Look up a driver whose whatsapp_phone matches the given number (digits-only compare)."""
    normalized = _normalize_phone(phone)
    if not normalized:
        return None
    result = await session.execute(
        select(Driver).where(Driver.active == True)  # noqa: E712
    )
    for driver in result.scalars().all():
        if _normalize_phone(driver.whatsapp_phone) == normalized:
            return driver
    return None


async def _find_active_trip_for_driver(
    session: AsyncSession, driver: Driver
) -> Trip | None:
    """Return the most recent in_progress trip for a driver, if any."""
    result = await session.execute(
        select(Trip)
        .where(
            Trip.driver_id == driver.id,
            Trip.company_id == driver.company_id,
            Trip.status == "in_progress",
        )
        .order_by(Trip.start_date.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


def _extract_message_parts(payload: dict) -> dict:
    """Extract the relevant fields from a whatsapp.message.received payload."""
    message = payload.get("message") or {}
    kapso = message.get("kapso") or {}
    msg_type = message.get("type")

    media_url = kapso.get("media_url")
    media_data = kapso.get("media_data") or {}
    content_type_hint = media_data.get("content_type")

    caption = None
    if msg_type == "image":
        caption = (message.get("image") or {}).get("caption")
    elif msg_type == "text":
        caption = (message.get("text") or {}).get("body")

    transcript = None
    if msg_type == "audio":
        transcript = (kapso.get("transcript") or {}).get("text")

    return {
        "from": message.get("from"),
        "type": msg_type,
        "caption": caption,
        "transcript": transcript,
        "media_url": media_url,
        "content_type_hint": content_type_hint,
        "message_id": message.get("id"),
    }


def _build_concept(msg_type: str, caption: str | None, transcript: str | None) -> str:
    candidate = (caption or transcript or "").strip()
    if candidate:
        return candidate[:512]
    if msg_type == "audio":
        return "Nota de voz"
    if msg_type == "image":
        return "Pendiente de revisión"
    return "Pendiente de revisión"


_CAPTION_RE = re.compile(r"^(?P<concept>.+?)\s*[-–—]\s*\$?\s*(?P<amount>[\d.,]+)\s*$")


def _ack_for_submission(concept: str, amount: float, parsed: bool) -> str:
    if parsed:
        return (
            f"✅ *{concept}* por *${amount:,.2f} MXN* registrado. "
            "Pendiente de revisión."
        )
    return (
        "📸 Recibido, pendiente de revisión.\n\n"
        "Tip: agrega la descripción al enviar la foto con el formato "
        "*Concepto - Monto* (ej. `Gasolina - 500`) para registrar el importe automáticamente."
    )


def _parse_concept_amount(caption: str | None) -> tuple[str | None, float | None]:
    """Parse 'Concepto - Monto' captions. Returns (concept, amount) or (None, None)."""
    if not caption:
        return None, None
    m = _CAPTION_RE.match(caption.strip())
    if not m:
        return None, None
    concept = m.group("concept").strip()[:512] or None
    amount_str = m.group("amount")
    if "." in amount_str and "," in amount_str:
        amount_str = amount_str.replace(".", "").replace(",", ".")
    elif "," in amount_str:
        parts = amount_str.split(",")
        if len(parts) == 2 and 1 <= len(parts[1]) <= 2:
            amount_str = parts[0] + "." + parts[1]
        else:
            amount_str = amount_str.replace(",", "")
    try:
        amount = float(amount_str)
    except ValueError:
        return concept, None
    if amount <= 0:
        return concept, None
    return concept, amount


async def handle_inbound_message(
    session: AsyncSession, payload: dict
) -> dict:
    """Entry point for whatsapp.message.received events.

    Returns a small dict describing what was done (for logging / debugging).
    """
    parts = _extract_message_parts(payload)
    msg_type = parts["type"]
    from_phone = parts["from"]

    logger.info(
        "Inbound WA message_id=%s type=%s from=%s has_media_url=%s content_type_hint=%r",
        parts.get("message_id"),
        msg_type,
        from_phone,
        bool(parts.get("media_url")),
        parts.get("content_type_hint"),
    )

    if msg_type not in ("image", "audio"):
        logger.info("Ignoring inbound WA message type=%s from=%s", msg_type, from_phone)
        return {"ok": True, "action": "ignored", "reason": f"unsupported type {msg_type}"}

    driver = await _find_driver_by_phone(session, from_phone)
    if not driver:
        logger.warning("No driver found for phone %s", from_phone)
        if from_phone:
            await send_ack(
                from_phone,
                "No encontramos tu número registrado. Contacta a tu administrador.",
            )
        return {"ok": True, "action": "no_driver"}

    trip = await _find_active_trip_for_driver(session, driver)
    if not trip:
        await send_ack(
            driver.whatsapp_phone,
            f"Hola {driver.name}, no tienes un viaje activo. Espera a que se inicie uno para enviar gastos.",
        )
        return {"ok": True, "action": "no_active_trip"}

    media_url = parts["media_url"]
    if not media_url:
        logger.warning("Inbound message has no media_url: %s", parts.get("message_id"))
        await send_ack(
            driver.whatsapp_phone,
            "No pudimos descargar tu archivo. Por favor intenta de nuevo.",
        )
        return {"ok": True, "action": "no_media_url"}

    downloaded = await download_media(media_url)
    if not downloaded:
        await send_ack(
            driver.whatsapp_phone,
            "No pudimos descargar tu archivo. Por favor intenta de nuevo.",
        )
        return {"ok": True, "action": "media_download_failed"}

    file_bytes, resolved_content_type = downloaded
    raw_content_type = parts["content_type_hint"] or resolved_content_type
    content_type = (raw_content_type or "").split(";")[0].strip().lower()

    logger.info(
        "Resolved content type: raw=%r normalized=%r hint=%r resolved=%r bytes=%d",
        raw_content_type,
        content_type,
        parts["content_type_hint"],
        resolved_content_type,
        len(file_bytes),
    )

    if content_type not in ALLOWED_CONTENT_TYPES:
        logger.warning(
            "Unsupported content type raw=%r normalized=%r hint=%r resolved=%r from driver %s",
            raw_content_type,
            content_type,
            parts["content_type_hint"],
            resolved_content_type,
            driver.id,
        )
        await send_ack(
            driver.whatsapp_phone,
            "Tipo de archivo no soportado. Envía foto del ticket o nota de voz.",
        )
        return {"ok": True, "action": "unsupported_content_type", "content_type": content_type}

    try:
        object_key = await upload_evidence(file_bytes, content_type, str(trip.id))
    except ValueError as e:
        logger.error("Upload failed: %s", e)
        await send_ack(driver.whatsapp_phone, f"Error al guardar la evidencia: {e}")
        return {"ok": True, "action": "upload_failed"}

    evidence_url = get_evidence_url(object_key)
    evidence_type = evidence_type_for_content(content_type)

    parsed_concept, parsed_amount = _parse_concept_amount(parts["caption"])
    concept = parsed_concept or _build_concept(msg_type, parts["caption"], parts["transcript"])
    amount = parsed_amount or 0.0

    rejected_result = await session.execute(
        select(Movement)
        .where(Movement.trip_id == trip.id, Movement.evidence_status == "rejected")
        .order_by(Movement.rejected_at.asc())
        .limit(1)
    )
    rejected = rejected_result.scalar_one_or_none()

    if rejected is not None:
        print(
            f"[WA] Reviving rejected movement_id={rejected.id} on trip_id={trip.id}",
            flush=True,
        )
        old_amount = float(rejected.amount or 0)
        delta = amount - old_amount
        rejected.evidence_url = evidence_url
        rejected.evidence_type = evidence_type
        rejected.concept = concept
        rejected.amount = amount
        rejected.evidence_status = "pending"
        rejected.rejection_reason = None
        rejected.rejected_at = None
        if delta:
            if rejected.type == "income":
                trip.total_income = float(trip.total_income or 0) + delta
            else:
                trip.total_expense = float(trip.total_expense or 0) + delta
        await session.flush()
        created = await create_pending_evidence_notifications(
            session,
            company_id=driver.company_id,
            trip_id=trip.id,
            movement_id=rejected.id,
            movement_concept=rejected.concept,
            movement_amount=rejected.amount,
            currency=rejected.currency,
        )
        print(f"[WA] Revision notifications created={created}", flush=True)
        await session.commit()

        await send_ack(driver.whatsapp_phone, _ack_for_submission(concept, amount, parsed_amount is not None))

        return {
            "ok": True,
            "action": "movement_revised",
            "movement_id": str(rejected.id),
            "trip_id": str(trip.id),
            "evidence_type": evidence_type,
            "parsed": parsed_amount is not None,
        }

    data = {
        "type": "expense",
        "concept": concept,
        "amount": amount,
        "currency": "MXN",
        "movement_date": date.today(),
        "evidence_url": evidence_url,
        "evidence_type": evidence_type,
    }

    movement = await add_movement(
        session, company_id=driver.company_id, trip_id=trip.id, data=data
    )
    print(
        f"[WA] Created new movement_id={movement['id']} on trip_id={trip.id}",
        flush=True,
    )
    await session.commit()

    await send_ack(driver.whatsapp_phone, _ack_for_submission(concept, amount, parsed_amount is not None))

    return {
        "ok": True,
        "action": "movement_created",
        "movement_id": movement["id"],
        "trip_id": str(trip.id),
        "evidence_type": evidence_type,
        "parsed": parsed_amount is not None,
    }
