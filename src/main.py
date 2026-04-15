"""FastAPI app: async routes, domain routers, lifespan."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from src.config import settings
from src.exceptions import AppError, app_error_handler, validation_exception_handler
from src.auth.router import router as auth_router
from src.companies.router import router as companies_router
from src.drivers.router import router as drivers_router
from src.notifications.router import router as notifications_router
from src.trips.router import router as trips_router
from src.whatsapp.router import router as whatsapp_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: ensure MinIO bucket exists. Shutdown: dispose engine."""
    from src.storage import ensure_bucket

    await ensure_bucket()
    yield
    from src.database import engine

    await engine.dispose()


app = FastAPI(
    title="Travel Balance Sheet API",
    description="API para control de gastos e ingresos por viajes (dashboard + WhatsApp).",
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(AppError, app_error_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)


@app.get("/health")
async def health():
    """Liveness/readiness: API is up."""
    return {"status": "ok", "version": settings.APP_VERSION}


app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(companies_router, prefix="/api/companies", tags=["companies"])
app.include_router(drivers_router, prefix="/api/drivers", tags=["drivers"])
app.include_router(trips_router, prefix="/api/trips", tags=["trips"])
app.include_router(whatsapp_router, prefix="/api/whatsapp", tags=["whatsapp"])
app.include_router(notifications_router, prefix="/api/notifications", tags=["notifications"])

