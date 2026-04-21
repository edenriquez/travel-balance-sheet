"""Global app configuration from environment."""

from enum import StrEnum

from pydantic import field_validator
from pydantic_settings import BaseSettings


class Environment(StrEnum):
    LOCAL = "local"
    STAGING = "staging"
    PRODUCTION = "production"


class Config(BaseSettings):
    """App config. Loads from .env and environment variables."""

    DATABASE_URL: str
    ENVIRONMENT: Environment = Environment.LOCAL
    APP_VERSION: str = "1.0"
    CORS_ORIGINS: str = ""

    # Auth
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALG: str = "HS256"
    JWT_EXP_MINUTES: int = 60
    INVITE_TOKEN_EXP_DAYS: int = 7
    FRONTEND_URL: str = "http://localhost:5173"

    # WhatsApp (Kapso)
    KAPSO_API_KEY: str = ""
    KAPSO_PHONE_NUMBER_ID: str = ""
    KAPSO_WEBHOOK_SECRET: str = ""

    # MinIO (S3-compatible storage)
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET: str = "evidence"
    MINIO_USE_SSL: bool = False

    @field_validator("DATABASE_URL")
    @classmethod
    def ensure_async_driver(cls, v: str) -> str:
        if v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    @property
    def cors_origins_list(self) -> list[str]:
        if not self.CORS_ORIGINS.strip():
            return []
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Config()
