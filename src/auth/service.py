import secrets
from datetime import datetime, timezone, timedelta
from uuid import UUID

import bcrypt
from jose import JWTError, jwt
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import settings
from src.auth.exceptions import InvalidCredentials, InvalidToken
from src.models import CompanyMember, User


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def create_access_token(user_id: UUID, email: str, company_id: UUID, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXP_MINUTES)
    payload = {
        "sub": str(user_id),
        "email": email,
        "company_id": str(company_id),
        "role": role,
        "exp": expire,
    }
    return jwt.encode(
        payload,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALG,
    )


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALG])
    except JWTError:
        raise InvalidToken("Token inválido o expirado")


async def login(session: AsyncSession, email: str, password: str) -> tuple[str, dict]:
    result = await session.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user or not user.password_hash:
        raise InvalidCredentials()
    if not verify_password(password, user.password_hash):
        raise InvalidCredentials()
    result = await session.execute(
        select(CompanyMember).where(CompanyMember.user_id == user.id).limit(1)
    )
    member = result.scalar_one_or_none()
    if not member:
        raise InvalidCredentials()
    token = create_access_token(user.id, user.email, member.company_id, member.role)
    user_info = {
        "id": str(user.id),
        "email": user.email,
        "role": member.role,
        "company_id": str(member.company_id),
    }
    return token, user_info


async def set_password(session: AsyncSession, token: str, password: str) -> None:
    result = await session.execute(
        select(User).where(
            and_(
                User.invite_token == token,
                User.invite_token_expires_at > datetime.now(timezone.utc),
            )
        )
    )
    user = result.scalar_one_or_none()
    if not user:
        raise InvalidToken()
    user.password_hash = hash_password(password)
    user.invite_token = None
    user.invite_token_expires_at = None
    session.add(user)


def generate_invite_token() -> str:
    return secrets.token_urlsafe(32)


def invite_token_expires_at() -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=settings.INVITE_TOKEN_EXP_DAYS)
