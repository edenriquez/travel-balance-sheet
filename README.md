# Travel Balance Sheet

Sistema para control de **gastos e ingresos por viajes** de camión. Conductores reportan por **WhatsApp**; la oficina consulta en un **dashboard web** (mobile-first, español).

## Requisitos

- Python 3.11+
- Docker (para PostgreSQL local)

## Setup rápido

1. **Clonar y crear entorno**

   ```bash
   python -m venv .venv
   source .venv/bin/activate   # Windows: .venv\Scripts\activate
   pip install -r requirements/dev.txt
   ```

2. **Base de datos local (Docker)**

   ```bash
   docker compose up -d
   ```

3. **Variables de entorno**

   ```bash
   cp .env.example .env
   # Editar .env si hace falta (por defecto usa postgres en localhost:5432)
   ```

4. **Migraciones**

   ```bash
   alembic upgrade head
   ```

5. **Datos de prueba (opcional)**

   ```bash
   python -m scripts.seed
   # Con reset (borra tablas y vuelve a crear): python -m scripts.seed --reset
   ```
   Crea una empresa "Transportes Demo", usuarios **admin@demo.com**, **contador@demo.com**, **conductor@demo.com** (contraseña: `password123`), dos conductores, dos viajes (uno en curso, uno cerrado con movimientos).

   **Importante:** Si añadiste la funcionalidad de auth (invite/set-password), aplica antes la migración de las columnas `invite_token` en `user`:
   ```bash
   alembic upgrade head
   ```

6. **Ejecutar API**

   ```bash
   uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
   ```

- **Health**: [http://localhost:8000/health](http://localhost:8000/health)
- **Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

7. **Frontend (dashboard)**

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   - Dashboard: [http://localhost:5173](http://localhost:5173)  
   - El proxy de Vite redirige `/api` y `/health` al backend (puerto 8000). Sin backend, el login hace “demo” y entras al listado vacío.

## Estructura del proyecto

- `src/` – Backend FastAPI (rutas async, dominio por paquete).
- `src/models/` – Modelos SQLAlchemy (company, user, company_member, driver, trip, movement, whatsapp_session).
- `frontend/` – SPA React + Vite (mobile-first, español): login, listado de viajes, detalle de liquidación, miembros, mapa).
- `alembic/` – Migraciones.
- `docs/` – Plan de implementación y diseño.

## Plan de implementación

Ver [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md).
