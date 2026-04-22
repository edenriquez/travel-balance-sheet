from typing import Literal

from pydantic import BaseModel, EmailStr, Field

from src.auth.schemas import UserInfo


class OnboardingRegisterRequest(BaseModel):
    plan: Literal["basico", "pyme", "empresa"]
    company_name: str = Field(min_length=2, max_length=255)
    admin_name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(min_length=8, max_length=256)


class OnboardingRegisterResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserInfo
    company_id: str
    status: str
    plan: str


class OnboardingActivateRequest(BaseModel):
    card_name: str = Field(min_length=2, max_length=128)
    card_number: str = Field(min_length=12, max_length=24)
    expiry: str = Field(pattern=r"^\d{2}/\d{2}$")
    cvv: str = Field(min_length=3, max_length=4)


class OnboardingActivateResponse(BaseModel):
    company_id: str
    status: str
    activated_at: str
