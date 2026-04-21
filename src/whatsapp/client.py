"""WhatsApp messaging via Kapso Cloud API."""

import logging

import httpx

from src.config import settings

logger = logging.getLogger(__name__)

BASE_URL = "https://api.kapso.ai/meta/whatsapp/v24.0"


async def send_text_message(to: str, body: str) -> dict | None:
    """Send a text message via the Kapso WhatsApp API.

    Args:
        to: Recipient phone number (e.g. "+525512345678").
        body: Message text.

    Returns the API response dict, or None on failure.
    """
    if not settings.KAPSO_API_KEY or not settings.KAPSO_PHONE_NUMBER_ID:
        logger.warning("WhatsApp not configured (missing KAPSO_API_KEY or KAPSO_PHONE_NUMBER_ID)")
        return None

    url = f"{BASE_URL}/{settings.KAPSO_PHONE_NUMBER_ID}/messages"
    headers = {
        "X-API-Key": settings.KAPSO_API_KEY,
        "Content-Type": "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": to.lstrip("+"),
        "type": "text",
        "text": {"body": body},
    }

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            logger.info("WhatsApp message sent to %s", to)
            return data
    except httpx.HTTPStatusError as exc:
        logger.error(
            "WhatsApp API error %s: %s",
            exc.response.status_code,
            exc.response.text,
        )
        return None
    except Exception as exc:
        logger.error("WhatsApp send failed: %s", exc)
        return None


async def send_welcome_message(
    to: str,
    name: str,
    invite_link: str,
) -> dict | None:
    """Send a welcome message with the invite link to set up a password."""
    display = name or "miembro"
    body = (
        f"Bienvenido a *LogiConta Mexico*, {display}!\n\n"
        f"Tu cuenta ha sido creada. Para comenzar, establece tu contrasena "
        f"usando el siguiente enlace:\n\n"
        f"{invite_link}\n\n"
        f"Si tienes dudas, contacta a tu administrador."
    )
    return await send_text_message(to, body)


async def send_rejection_notice(
    to: str,
    driver_name: str,
    concept: str,
    amount: float,
    reason: str,
    folio: str | None = None,
) -> dict | None:
    """Notify a driver that an expense was rejected."""
    folio_str = f" (Folio #{folio})" if folio else ""
    body = (
        f"Hola {driver_name}, tu gasto de *{concept}* "
        f"por *${amount:,.2f} MXN*{folio_str} fue *rechazado*.\n\n"
        f"Motivo: _{reason}_\n\n"
        f"Por favor revisa y reenvia la evidencia."
    )
    return await send_text_message(to, body)


async def send_approval_notice(
    to: str,
    driver_name: str,
    concept: str,
    amount: float,
    folio: str | None = None,
) -> dict | None:
    """Notify a driver that an expense was approved."""
    folio_str = f" (Folio #{folio})" if folio else ""
    body = (
        f"Hola {driver_name}, tu gasto de *{concept}* "
        f"por *${amount:,.2f} MXN*{folio_str} fue *aprobado*. "
    )
    return await send_text_message(to, body)


async def send_trip_started_notice(
    to: str,
    driver_name: str,
    folio: str | None,
    origin: str,
    destination: str,
    client: str | None,
) -> dict | None:
    """Notify a driver that a new trip was started for them."""
    folio_str = f"\nFolio: {folio}" if folio else ""
    client_str = f"\nCliente: {client}" if client else ""
    body = (
        f"🚚 Hola {driver_name}, se ha iniciado un nuevo viaje.{folio_str}\n"
        f"Origen: {origin}\n"
        f"Destino: {destination}"
        f"{client_str}\n\n"
        f"Envía por este chat los gastos del viaje como *foto del ticket* "
        f"con el formato *Concepto - Monto* en la descripción.\n"
        f"Ejemplo: `Gasolina - 500`"
    )
    return await send_text_message(to, body)


async def send_ack(to: str, message: str) -> dict | None:
    """Simple acknowledgement message to a driver."""
    return await send_text_message(to, message)


async def download_media(url: str) -> tuple[bytes, str] | None:
    """Download a media file from a Kapso media URL.

    The URL carries an embedded short-lived token, so no auth header is needed.
    Returns (bytes, content_type) or None on failure.
    """
    try:
        async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            content_type = resp.headers.get("content-type", "application/octet-stream").split(";")[0].strip()
            return resp.content, content_type
    except httpx.HTTPStatusError as exc:
        logger.error(
            "Media download error %s: %s",
            exc.response.status_code,
            exc.response.text,
        )
        return None
    except Exception as exc:
        logger.error("Media download failed: %s", exc)
        return None
