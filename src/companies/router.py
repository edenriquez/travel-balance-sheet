from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.dependencies import get_current_user, require_admin
from src.companies.schemas import (
    DeleteResponse,
    MemberCreate,
    MemberCreateResponse,
    MemberResponse,
    MemberUpdate,
)
from src.companies.service import create_member, delete_member, list_members, update_member
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
    return await create_member(
        session, company_id, body.email, body.role,
        name=body.name, whatsapp=body.whatsapp,
    )


@router.patch("/current/members/{member_id}", response_model=MemberResponse)
async def patch_member(
    member_id: str,
    body: MemberUpdate,
    current_user: dict = Depends(require_admin),
    session: AsyncSession = Depends(get_db),
):
    company_id = UUID(current_user["company_id"])
    return await update_member(session, company_id, UUID(member_id), body.model_dump(exclude_none=True))


@router.delete("/current/members/{member_id}", response_model=DeleteResponse)
async def remove_member(
    member_id: str,
    current_user: dict = Depends(require_admin),
    session: AsyncSession = Depends(get_db),
):
    company_id = UUID(current_user["company_id"])
    return await delete_member(session, company_id, UUID(member_id))
