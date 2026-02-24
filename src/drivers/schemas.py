from pydantic import BaseModel


class DriverResponse(BaseModel):
    id: str
    name: str

