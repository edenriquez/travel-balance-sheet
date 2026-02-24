from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.auth.schemas import (
    LoginRequest,
    LoginResponse,
    SetPasswordRequest,
    SetPasswordResponse,
    UserInfo,
)
from src.auth.service import login as do_login, set_password as do_set_password

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
async def login(
    body: LoginRequest,
    session: AsyncSession = Depends(get_db),
):
    token, user_info = await do_login(session, body.email, body.password)
    return LoginResponse(
        access_token=token,
        user=UserInfo(**user_info),
    )


@router.post("/set-password", response_model=SetPasswordResponse)
async def set_password(
    body: SetPasswordRequest,
    session: AsyncSession = Depends(get_db),
):
    await do_set_password(session, body.token, body.password)
    return SetPasswordResponse()
