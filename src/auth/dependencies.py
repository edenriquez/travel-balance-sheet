from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from src.auth.exceptions import InvalidToken
from src.auth.service import decode_token

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise InvalidToken("Falta el token de acceso")
    payload = decode_token(credentials.credentials)
    return {
        "user_id": payload["sub"],
        "email": payload["email"],
        "company_id": payload["company_id"],
        "role": payload["role"],
    }


def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != "admin":
        from src.auth.exceptions import Forbidden
        raise Forbidden("Solo un administrador puede realizar esta acción")
    return current_user
