from datetime import date, datetime, time

from pydantic import BaseModel, Field


class TripCreate(BaseModel):
    load_date: date = Field(..., description="Fecha de carga")
    load_time: time = Field(..., description="Hora de carga")
    folio: str
    origin_name: str
    load_company: str
    destination_name: str
    delivery_client: str
    unit_type: str
    driver_id: str = Field(..., description="Operador (driver_id)")
    truck: str
    trailer: str


class TripUpdate(BaseModel):
    status: str | None = Field(None, description="Estado del viaje")
    notes: str | None = Field(None, max_length=2048, description="Notas al cerrar el viaje")
    total_income: float | None = Field(None, description="Ingresos totales")
    total_expense: float | None = Field(None, description="Gastos totales")


class TripResponse(BaseModel):
    id: str
    driver_id: str
    folio: str | None = None
    origin_name: str
    destination_name: str
    load_date: date | None = None
    load_time: time | None = None
    load_company: str | None = None
    delivery_client: str | None = None
    unit_type: str | None = None
    truck: str | None = None
    trailer: str | None = None
    start_date: datetime
    end_date: datetime | None = None
    status: str
    notes: str | None = None
    total_income: float
    total_expense: float


class MovementCreate(BaseModel):
    type: str = Field(..., pattern="^(income|expense)$", description="income o expense")
    concept: str
    amount: float = Field(..., gt=0)
    currency: str = "MXN"
    movement_date: date


class RejectMovement(BaseModel):
    rejection_reason: str = Field(..., min_length=1, max_length=1024)
    notify_whatsapp: bool = False


class ApproveMovement(BaseModel):
    concept: str | None = Field(None, min_length=1, max_length=512)
    amount: float | None = Field(None, gt=0)


class MovementResponse(BaseModel):
    id: str
    type: str
    concept: str
    amount: float
    currency: str
    movement_date: date
    evidence_url: str | None = None
    evidence_type: str | None = None
    evidence_status: str = "pending"
    rejection_reason: str | None = None
    rejected_at: datetime | None = None


class TripDetailResponse(TripResponse):
    movements: list[MovementResponse] = []
