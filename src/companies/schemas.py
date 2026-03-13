from pydantic import BaseModel, EmailStr


class MemberCreate(BaseModel):
    email: EmailStr
    role: str  # accountant | driver
    name: str | None = None
    whatsapp: str | None = None


class MemberUpdate(BaseModel):
    name: str | None = None
    role: str | None = None
    whatsapp: str | None = None


class MemberResponse(BaseModel):
    id: str
    email: str
    role: str
    has_password: bool
    name: str | None = None
    whatsapp: str | None = None


class MemberCreateResponse(BaseModel):
    id: str
    email: str
    role: str
    invite_link: str | None = None


class DeleteResponse(BaseModel):
    message: str
