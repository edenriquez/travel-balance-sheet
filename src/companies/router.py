from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.dependencies import get_current_user, require_admin
from src.companies.schemas import MemberCreate, MemberCreateResponse, MemberResponse
from src.companies.service import create_member, list_members
from src.database import get_db

router = APIRouter()


@router.get("/current/members", response_model=list[MemberResponse])
async def get_my_company_members(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    company_id = UUID(current_user["company_id"])
    return await list_members(session, company_id)


@router.post("/current/members", response_model=MemberCreateResponse)
async def invite_member(
    body: MemberCreate,
    current_user: dict = Depends(require_admin),
    session: AsyncSession = Depends(get_db),
):
    company_id = UUID(current_user["company_id"])
    return await create_member(session, company_id, body.email, body.role)
