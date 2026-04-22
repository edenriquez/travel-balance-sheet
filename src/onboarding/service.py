import re
import secrets
from datetime import datetime, timezone
from uuid import UUID

from fastapi import status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.service import create_access_token, hash_password
from src.exceptions import AppError
from src.models import Company, CompanyMember, User


def _slugify(name: str) -> str:
    s = name.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s[:100] or "empresa"


async def _unique_slug(session: AsyncSession, base: str) -> str:
    slug = base
    for _ in range(5):
        result = await session.execute(select(Company.id).where(Company.slug == slug))
        if result.scalar_one_or_none() is None:
            return slug
        slug = f"{base}-{secrets.token_hex(3)}"
    return f"{base}-{secrets.token_hex(4)}"


async def register_company(
    session: AsyncSession,
    *,
    plan: str,
    company_name: str,
    admin_name: str,
    email: str,
    password: str,
) -> dict:
    existing = await session.execute(select(User).where(User.email == email))
    if existing.scalar_one_or_none():
        raise AppError(
            "Ya existe un usuario con ese correo",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    slug = await _unique_slug(session, _slugify(company_name))

    company = Company(
        name=company_name.strip(),
        slug=slug,
        status="pending_payment",
        plan=plan,
        activated_at=None,
        settings={"admin_name": admin_name.strip()},
    )
    session.add(company)
    await session.flush()

    user = User(
        email=email.lower(),
        password_hash=hash_password(password),
    )
    session.add(user)
    await session.flush()

    member = CompanyMember(
        company_id=company.id,
        user_id=user.id,
        role="admin",
    )
    session.add(member)
    await session.flush()

    token = create_access_token(user.id, user.email, company.id, member.role)
    return {
        "access_token": token,
        "user": {
            "id": str(user.id),
            "email": user.email,
            "role": member.role,
            "company_id": str(company.id),
        },
        "company_id": str(company.id),
        "status": company.status,
        "plan": company.plan,
    }


async def activate_company(session: AsyncSession, *, company_id: UUID) -> dict:
    result = await session.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise AppError("Empresa no encontrada", status_code=status.HTTP_404_NOT_FOUND)
    if company.status == "active":
        return {
            "company_id": str(company.id),
            "status": company.status,
            "activated_at": (company.activated_at or company.created_at).isoformat(),
        }
    company.status = "active"
    company.activated_at = datetime.now(timezone.utc)
    await session.flush()
    return {
        "company_id": str(company.id),
        "status": company.status,
        "activated_at": company.activated_at.isoformat(),
    }
