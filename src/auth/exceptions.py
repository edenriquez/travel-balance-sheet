from fastapi import status

from src.exceptions import AppError


class InvalidCredentials(AppError):
    def __init__(self) -> None:
        super().__init__("Correo o contraseña incorrectos", status_code=status.HTTP_401_UNAUTHORIZED)


class InvalidToken(AppError):
    def __init__(self, message: str = "Enlace de invitación inválido o expirado") -> None:
        super().__init__(message, status_code=status.HTTP_401_UNAUTHORIZED)


class Forbidden(AppError):
    def __init__(self, message: str = "No tienes permiso para esta acción") -> None:
        super().__init__(message, status_code=status.HTTP_403_FORBIDDEN)
