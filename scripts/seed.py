"""
Testing seed: populate DB with one company, users (admin/accountant/driver), drivers, and trips.

Run from project root:
  python -m scripts.seed
  python -m scripts.seed --reset   # clear tables first, then seed

Default test login: admin@demo.com / password123
"""

import argparse
import asyncio
import uuid
from datetime import date, datetime, time, timedelta, timezone

import bcrypt
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import async_session_factory, engine
from src.models import Company, CompanyMember, Driver, Movement, Trip, User

# Fixed password for all seed users
SEED_PASSWORD = "password123"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


async def seed(session: AsyncSession) -> None:
    now = datetime.now(timezone.utc)
    today = date.today()

    # 1. Company
    company = Company(
        id=uuid.uuid4(),
        name="Transportes Demo",
        slug="transportes-demo",
        settings={"timezone": "America/Mexico_City"},
        created_at=now,
        updated_at=now,
    )
    session.add(company)
    await session.flush()

    # 2. Users (admin, accountant, driver)
    admin_user = User(
        id=uuid.uuid4(),
        email="admin@demo.com",
        password_hash=hash_password(SEED_PASSWORD),
        created_at=now,
        updated_at=now,
    )
    session.add(admin_user)
    await session.flush()

    accountant_user = User(
        id=uuid.uuid4(),
        email="contador@demo.com",
        password_hash=hash_password(SEED_PASSWORD),
        created_at=now,
        updated_at=now,
    )
    session.add(accountant_user)
    await session.flush()

    driver_user = User(
        id=uuid.uuid4(),
        email="conductor@demo.com",
        password_hash=hash_password(SEED_PASSWORD),
        created_at=now,
        updated_at=now,
    )
    session.add(driver_user)
    await session.flush()

    # 3. Company members
    for user, role in [(admin_user, "admin"), (accountant_user, "accountant"), (driver_user, "driver")]:
        session.add(
            CompanyMember(
                id=uuid.uuid4(),
                company_id=company.id,
                user_id=user.id,
                role=role,
                created_at=now,
                updated_at=now,
            )
        )
    await session.flush()

    # 4. Drivers
    driver1 = Driver(
        id=uuid.uuid4(),
        company_id=company.id,
        name="Juan Pérez",
        whatsapp_phone="+5215512345678",
        active=True,
        created_at=now,
        updated_at=now,
    )
    session.add(driver1)
    await session.flush()

    driver2 = Driver(
        id=uuid.uuid4(),
        company_id=company.id,
        name="María García",
        whatsapp_phone="+5215598765432",
        active=True,
        created_at=now,
        updated_at=now,
    )
    session.add(driver2)
    await session.flush()

    # 5. Trips
    trip1 = Trip(
        id=uuid.uuid4(),
        company_id=company.id,
        driver_id=driver1.id,
        origin_name="CDMX (Central de Abastos)",
        destination_name="Monterrey, NL",
        load_date=today,
        load_time=time(9, 0),
        folio="FOL-0001",
        load_company="Empresa Demo",
        delivery_client="Cliente Monterrey",
        unit_type="Tractocamión",
        truck="CARRO-01",
        trailer="CAJA-01",
        lat_origin=19.4326,
        lng_origin=-99.1332,
        lat_destiny=25.6866,
        lng_destiny=-100.3161,
        start_date=now - timedelta(days=2),
        end_date=None,
        status="in_progress",
        total_income=0,
        total_expense=0,
        created_at=now,
        updated_at=now,
    )
    session.add(trip1)
    await session.flush()

    trip2 = Trip(
        id=uuid.uuid4(),
        company_id=company.id,
        driver_id=driver2.id,
        origin_name="Guadalajara, Jal",
        destination_name="Tijuana, BC",
        load_date=today,
        load_time=time(7, 30),
        folio="FOL-0002",
        load_company="Empresa Guadalajara",
        delivery_client="Cliente Tijuana",
        unit_type="Torton",
        truck="CARRO-02",
        trailer="CAJA-02",
        lat_origin=20.6597,
        lng_origin=-103.3496,
        lat_destiny=32.5149,
        lng_destiny=-117.0382,
        start_date=now - timedelta(days=5),
        end_date=now - timedelta(days=3),
        status="closed",
        total_income=15000.00,
        total_expense=8200.00,
        created_at=now,
        updated_at=now,
    )
    session.add(trip2)
    await session.flush()

    # 6. Movements for trip2 (closed)
    for concept, movement_type, amount in [
        ("Flete", "income", 12000),
        ("Extra carga", "income", 3000),
        ("Gasolina", "expense", 4500),
        ("Caseta", "expense", 1200),
        ("Comida", "expense", 500),
        ("Hospedaje", "expense", 2000),
    ]:
        session.add(
            Movement(
                id=uuid.uuid4(),
                trip_id=trip2.id,
                type=movement_type,
                concept=concept,
                amount=amount,
                currency="MXN",
                movement_date=today,
                created_at=now,
            )
        )

    # One income for trip1 (in progress)
    session.add(
        Movement(
            id=uuid.uuid4(),
            trip_id=trip1.id,
            type="income",
            concept="Anticipo flete",
            amount=5000,
            currency="MXN",
            movement_date=today,
            created_at=now,
        )
    )

    await session.commit()
    print("Seed OK.")
    print("  Company: Transportes Demo (slug: transportes-demo)")
    print("  Users: admin@demo.com, contador@demo.com, conductor@demo.com")
    print("  Password for all: " + SEED_PASSWORD)
    print("  Drivers: Juan Pérez, María García")
    print("  Trips: 1 en curso (CDMX → Monterrey), 1 cerrado (Guadalajara → Tijuana)")


async def reset(session: AsyncSession) -> None:
    """Delete seed data in FK-safe order."""
    for table in ("movement", "trip", "company_member", "driver", "whatsapp_session", "company", "user"):
        await session.execute(text(f"DELETE FROM {table}"))
    await session.commit()
    print("Tables cleared.")


async def main() -> None:
    parser = argparse.ArgumentParser(description="Seed DB with test data")
    parser.add_argument("--reset", action="store_true", help="Clear tables before seeding")
    args = parser.parse_args()

    async with async_session_factory() as session:
        try:
            if args.reset:
                await reset(session)
            await seed(session)
        finally:
            await session.close()
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
