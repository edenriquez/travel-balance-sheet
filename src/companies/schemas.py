from pydantic import BaseModel, EmailStr


class MemberCreate(BaseModel):
    email: EmailStr
    role: str  # accountant | driver


class MemberResponse(BaseModel):
    id: str
    email: str
    role: str
    has_password: bool


class MemberCreateResponse(BaseModel):
    id: str
    email: str
    role: str
    invite_link: str
