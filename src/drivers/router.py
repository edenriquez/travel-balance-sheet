from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.dependencies import get_current_user
from src.database import get_db
from src.drivers.schemas import DriverResponse
from src.drivers.service import list_drivers

router = APIRouter()


@router.get("", response_model=list[DriverResponse])
async def get_drivers(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    company_id = UUID(current_user["company_id"])
    return await list_drivers(session, company_id)

