from uuid import UUID

from fastapi import status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.service import generate_invite_token, invite_token_expires_at
from src.config import settings
from src.exceptions import AppError
from src.models import CompanyMember, Driver, User
from src.whatsapp import send_welcome_message


async def list_members(session: AsyncSession, company_id: UUID) -> list[dict]:
    result = await session.execute(
        select(CompanyMember, User.email, User.password_hash)
        .join(User, CompanyMember.user_id == User.id)
        .where(CompanyMember.company_id == company_id)
    )
    rows = result.all()
    return [
        {
            "id": str(m.id),
            "email": email,
            "role": m.role,
            "has_password": password_hash is not None,
        }
        for m, email, password_hash in rows
    ]


async def create_member(
    session: AsyncSession,
    company_id: UUID,
    email: str,
    role: str,
    name: str | None = None,
    whatsapp: str | None = None,
) -> dict:
    if role not in ("accountant", "driver"):
        raise AppError(
            "El rol debe ser accountant o driver",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    if role == "driver" and not whatsapp:
        raise AppError(
            "El numero de WhatsApp es obligatorio para choferes",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    result = await session.execute(select(User).where(User.email == email))
    if result.scalar_one_or_none():
        raise AppError(
            "Ya existe un usuario con ese correo",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    token = generate_invite_token()
    expires = invite_token_expires_at()
    user = User(
        email=email,
        password_hash=None,
        invite_token=token,
        invite_token_expires_at=expires,
    )
    session.add(user)
    await session.flush()

    member = CompanyMember(
        company_id=company_id,
        user_id=user.id,
        role=role,
    )
    session.add(member)
    await session.flush()

    # If driver, also create a Driver record
    if role == "driver" and whatsapp:
        driver = Driver(
            company_id=company_id,
            name=name or email.split("@")[0],
            whatsapp_phone=whatsapp,
        )
        session.add(driver)
        await session.flush()

    invite_link = (
        f"{settings.FRONTEND_URL.rstrip('/')}/establecer-contrasena?token={token}"
    )

    # Send WhatsApp welcome message with invite link
    if whatsapp:
        await send_welcome_message(
            to=whatsapp,
            name=name or email.split("@")[0],
            invite_link=invite_link,
        )

    return {
        "id": str(member.id),
        "email": email,
        "role": role,
        "invite_link": invite_link,
    }


async def update_member(
    session: AsyncSession,
    company_id: UUID,
    member_id: UUID,
    data: dict,
) -> dict:
    result = await session.execute(
        select(CompanyMember)
        .where(CompanyMember.id == member_id, CompanyMember.company_id == company_id)
    )
    member = result.scalar_one_or_none()
    if not member:
        raise AppError("Miembro no encontrado", status_code=status.HTTP_404_NOT_FOUND)

    if data.get("role") is not None:
        if data["role"] not in ("accountant", "driver"):
            raise AppError(
                "El rol debe ser accountant o driver",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        member.role = data["role"]

    await session.flush()

    result = await session.execute(select(User).where(User.id == member.user_id))
    user = result.scalar_one()

    return {
        "id": str(member.id),
        "email": user.email,
        "role": member.role,
        "has_password": user.password_hash is not None,
    }


async def delete_member(
    session: AsyncSession,
    company_id: UUID,
    member_id: UUID,
) -> dict:
    result = await session.execute(
        select(CompanyMember)
        .where(CompanyMember.id == member_id, CompanyMember.company_id == company_id)
    )
    member = result.scalar_one_or_none()
    if not member:
        raise AppError("Miembro no encontrado", status_code=status.HTTP_404_NOT_FOUND)

    await session.delete(member)
    await session.flush()

    return {"message": "Miembro eliminado correctamente"}
