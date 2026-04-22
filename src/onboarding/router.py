from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.dependencies import get_current_user
from src.auth.schemas import UserInfo
from src.database import get_db
from src.onboarding.schemas import (
    OnboardingActivateRequest,
    OnboardingActivateResponse,
    OnboardingRegisterRequest,
    OnboardingRegisterResponse,
)
from src.onboarding.service import activate_company, register_company

router = APIRouter()


@router.post("/register", response_model=OnboardingRegisterResponse)
async def register(
    body: OnboardingRegisterRequest,
    session: AsyncSession = Depends(get_db),
):
    result = await register_company(
        session,
        plan=body.plan,
        company_name=body.company_name,
        admin_name=body.admin_name,
        email=body.email,
        password=body.password,
    )
    return OnboardingRegisterResponse(
        access_token=result["access_token"],
        user=UserInfo(**result["user"]),
        company_id=result["company_id"],
        status=result["status"],
        plan=result["plan"],
    )


@router.post("/activate", response_model=OnboardingActivateResponse)
async def activate(
    _body: OnboardingActivateRequest,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    # Payment details are accepted but not charged (no PSP integration yet).
    result = await activate_company(session, company_id=UUID(current_user["company_id"]))
    return OnboardingActivateResponse(**result)
