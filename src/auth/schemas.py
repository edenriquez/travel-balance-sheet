from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserInfo(BaseModel):
    id: str
    email: str
    role: str
    company_id: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserInfo


class SetPasswordRequest(BaseModel):
    token: str
    password: str


class SetPasswordResponse(BaseModel):
    message: str = "Contraseña establecida. Ya puedes iniciar sesión."
