from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models import Driver


async def list_drivers(session: AsyncSession, company_id: UUID) -> list[dict]:
    result = await session.execute(
        select(Driver).where(Driver.company_id == company_id, Driver.active.is_(True)).order_by(Driver.name)
    )
    drivers = result.scalars().all()
    return [{"id": str(d.id), "name": d.name} for d in drivers]

