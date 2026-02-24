from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.service import generate_invite_token, invite_token_expires_at
from src.config import settings
from src.models import CompanyMember, User


async def list_members(session: AsyncSession, company_id: UUID) -> list[dict]:
    result = await session.execute(
        select(CompanyMember, User.email, User.password_hash).join(
            User, CompanyMember.user_id == User.id
        ).where(CompanyMember.company_id == company_id)
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
) -> dict:
    from src.auth.exceptions import AppError
    from fastapi import status

    if role not in ("accountant", "driver"):
        raise AppError("El rol debe ser accountant o driver", status_code=status.HTTP_400_BAD_REQUEST)

    result = await session.execute(select(User).where(User.email == email))
    if result.scalar_one_or_none():
        raise AppError("Ya existe un usuario con ese correo", status_code=status.HTTP_400_BAD_REQUEST)

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

    invite_link = f"{settings.FRONTEND_URL.rstrip('/')}/establecer-contrasena?token={token}"
    return {
        "id": str(member.id),
        "email": email,
        "role": role,
        "invite_link": invite_link,
    }
