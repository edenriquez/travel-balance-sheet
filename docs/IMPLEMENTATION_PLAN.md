# Plan de implementación – Hoja de balance de viajes

## Resumen del sistema

Sistema para que una empresa pequeña (1–2 usuarios) lleve el control de **gastos e ingresos por viajes** de camión. Los conductores se registran y reportan viajes por **WhatsApp**; la oficina/contador consulta todo en un **dashboard web** (mobile-first, en español).

---

## 1. Respuestas a las preguntas de diseño

### ¿Dónde guardar los datos?

**Recomendación: PostgreSQL con Docker para desarrollo local**

| Opción | Ventajas | Desventajas |
|--------|----------|-------------|
| **PostgreSQL** | Escalable, multiusuario, ideal para SaaS multi-tenant, estándar en producción | Requiere servidor de BD (o contenedor) |
| SQLite | Sin servidor, un solo archivo | No escala bien para múltiples empresas/usuarios |

Para un producto **SaaS** con varias empresas (tenants), **PostgreSQL** es la mejor opción:

- Soporta múltiples empresas en la misma base de datos (multi-tenancy por `company_id`).
- Docker permite levantar PostgreSQL localmente con un solo comando para pruebas.
- FastAPI + SQLAlchemy con PostgreSQL es un stack estándar y fácil de desplegar.

**Setup inicial con Docker (pruebas locales):**

- `docker-compose.yml` con servicio `postgres` (imagen oficial, volumen para persistencia, variables de entorno para usuario/contraseña/BD).
- La app se conecta a `DATABASE_URL` (localmente apuntando al contenedor, ej. `postgresql://user:pass@localhost:5432/travel_balance`).
- Mismas migraciones sirven para local (Docker) y para entornos remotos.

Ejemplo mínimo de servicio en `docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: travel_balance
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
```

**Estructura de datos sugerida:** ver sección 4 (Modelo de datos), que incluye la tabla **companies** y **company_id** en conductores y viajes para identificar a qué empresa pertenece cada recurso.

La **UI** se mantiene 100 % en **español** (México); los nombres de tablas/columnas y endpoints de la API pueden estar en inglés para consistencia técnica.

---

### ¿Cómo mostrar los datos?

**Recomendación: Dashboard web (SPA o SSR ligero) + mapa tipo Uber**

1. **Dashboard web (mobile-first, español)**  
   - Lista/tabla de viajes con filtros: **fecha del viaje**, **conductor (driver id)**, **estado del viaje** (en curso / cerrado).  
   - Tarjetas o filas con: conductor, fechas, origen → destino, estado, resumen de ingresos/gastos.  
   - Diseño alineado a las pantallas de Stitch:  
     - *Dashboard de Control de Viajes* (ID: 0fae5761eb8740e892c91f076e00c452)  
     - *Detalle de Liquidación de Viaje* (ID: 492e4b92f25447b5bd5f6f9787ba03ba).

2. **Mapa de viajes (estilo Uber)**  
   - Un mapa (Leaflet + OpenStreetMap, gratis) con rutas por viaje: línea desde origen hasta destino (polyline o direcciones).   
   - Cada viaje se puede seleccionar para ver su ruta y su detalle (liquidación).  
   - Opción: filtrar en el mapa por los mismos criterios (fecha, conductor, estado).

3. **Detalle de liquidación**  
   - Pantalla/modal “Detalle de Liquidación de Viaje”: desglose de ingresos, gastos y balance por viaje, solo lectura cuando el viaje está **cerrado**.

La “mejor” forma de mostrar es: **pocas pantallas**, **filtros claros** y **mapa integrado** para dar contexto geográfico sin abrumar.

---

### ¿Cómo actualizar los datos?

**Recomendación: dos flujos separados**

1. **Operador (dashboard web)**  
   - Crear/editar conductores de su empresa.  
   - **Crear el viaje** desde el dashboard: selecciona conductor, origen, destino, fecha inicio (y opcionalmente ingresos/gastos iniciales).  
   - Al **crear el viaje**, el sistema **envía automáticamente un mensaje por WhatsApp al conductor** (trigger), por ejemplo: “Tienes un nuevo viaje asignado: [origen] → [destino], inicio [fecha]. Responde por aquí para agregar gastos/ingresos o para cerrar el viaje al llegar.”  
   - Ver todos los viajes de la empresa; filtrar por fecha, conductor, estado.  
   - Editar viaje **solo si está en curso** (agregar gastos/ingresos, corregir datos).  
   - Cerrar viaje manualmente si hace falta (mismo efecto que “Cerrar viaje” por WhatsApp).  
   - No permitir edición de viajes cerrados.

2. **Conductor (WhatsApp)**  
   - **Registro**: mensaje tipo “Registro” o “Alta” con nombre → el sistema lo asocia al número de WhatsApp (y a la empresa si ya existe un vínculo, o se gestiona desde el dashboard).  
   - **No crea viajes por WhatsApp**: los viajes los crea el operador; el conductor solo recibe la notificación y puede actualizar.  
   - **Durante el viaje**: “Agregar gasto [concepto] [monto]” / “Agregar ingreso [concepto] [monto]”.  
   - **Cerrar viaje**: “Cerrar viaje” (y opcionalmente fecha fin) cuando llega a destino → el sistema marca el viaje como **cerrado** y ya no se permiten más cambios.

Resumen: **creación de viajes en el dashboard por el operador** → **trigger WhatsApp al conductor**; **actualizaciones por WhatsApp** (conductor) y **consulta/edición por web** (operador); regla fija: **viaje cerrado = solo lectura**.

---

## 2. Arquitectura técnica propuesta

```
┌─────────────────┐     WhatsApp Business API / Twilio / etc.     ┌──────────────────┐
│  Conductor      │ ◄──────────────────────────────────────────► │  Backend FastAPI │
│  (WhatsApp)     │     Recibe viaje asignado; agrega gastos/     │  + PostgreSQL    │
└─────────────────┘     ingresos; cierra viaje                     └────────┬─────────┘
                                                                             │
                                                                             │ REST API (English)
                                                                             ▼
┌─────────────────┐     Operador crea viaje → trigger WhatsApp   ┌──────────────────┐
│  Operador       │ ◄────────── Dashboard web (mobile-first) ───► │  Frontend        │
│  (navegador)    │     Español, filtros, mapa (Leaflet + OSM)   │  (HTML/JS o SPA) │
└─────────────────┘                                                └──────────────────┘
```

- **Backend**: Python 3.11+, FastAPI, SQLAlchemy (PostgreSQL), Pydantic.  
apply this repositories best practices https://github.com/zhanymkanov/fastapi-best-practices?tab=readme-ov-file#async-routes
- **Base de datos**: PostgreSQL; setup local con **Docker** (docker-compose) para pruebas.  
- **WhatsApp**: API de WhatsApp Business (Meta) o Twilio/MessageBird; webhook recibe mensajes; el backend **envía mensaje al conductor cuando el operador crea un viaje**.  
- **Frontend**: Página web responsive (mobile-first), en español; HTML/CSS/JS o React/Vue.  
- **Mapa**: **Leaflet + OpenStreetMap** (gratis); rutas estilo Uber con polyline (opcional: OSRM para geometría de ruta).

---

## 3. Stack sugerido

| Componente | Tecnología |
|------------|------------|
| Backend | Python 3.11+, FastAPI |
| ORM / BD | SQLAlchemy 2.x + PostgreSQL |
| Local dev | Docker (docker-compose con PostgreSQL) |
| Validación / DTOs | Pydantic v2 |
| WhatsApp | WhatsApp Cloud API (Meta) o Twilio API |
| Frontend | HTML5, CSS3, JavaScript (o React/Vue si se quiere SPA) |
| Mapas | Leaflet + OpenStreetMap; geocoding: Nominatim (gratis) |
| Idioma | API en inglés; UI y mensajes en español (MX) |
| Despliegue | VPS o PaaS; PostgreSQL gestionado o en contenedor |

---

## 4. Modelo de datos (esquema lógico)

**SaaS multi-tenant: identificar conductor por empresa**

La forma más simple y escalable para un SaaS es **tenant por fila**: una tabla **companies** y una columna **company_id** en todas las tablas que pertenecen a una empresa. Así cada driver (y cada viaje) queda asociado a una empresa.

- **companies** (empresas / tenants)  
  - id (PK), name, slug (único, para URL o subdominio), settings (JSON opcional), created_at, updated_at.

- **users** (usuarios del dashboard, autenticación por email)  
  - id (PK), email (único), password_hash (nullable hasta que el usuario define contraseña en pantalla “Establecer contraseña”), created_at, updated_at.

- **company_members** (miembros de la empresa; creados desde el dashboard)  
  - id (PK), company_id (FK), user_id (FK), role (enum: **admin**, **accountant**, **driver**), created_at, updated_at.  
  - Un usuario puede ser miembro de una empresa con un solo rol por empresa.  
  - **Admin** puede crear miembros con rol **accountant** o **driver** (desde el dashboard). Al crear un miembro se requiere **email**; el sistema envía invitación (correo o enlace) y el usuario accede a una **pantalla para establecer contraseña**; tras eso la autenticación es por **email + contraseña**.

- **drivers** (conductores, para viajes y WhatsApp)  
  - id (PK), **company_id (FK)**, name, whatsapp_phone (único por empresa: constraint UNIQUE(company_id, whatsapp_phone)), active, created_at, updated_at.

- **trips** (viajes)  
  - id (PK), **company_id (FK)**, driver_id (FK), origin_name, destination_name, lat_origin, lng_origin, lat_destiny, lng_destiny, start_date, end_date (nullable hasta que se cierra), status (enum: in_progress, closed), total_income, total_expense (redundante para listados), created_at, updated_at.

- **movements** (ingresos y gastos por viaje)  
  - id (PK), trip_id (FK), type (income | expense), concept, amount, currency (default MXN), movement_date, created_at.  
  - Restricción: no insertar/actualizar movimientos si el viaje está cerrado.

- **whatsapp_sessions** (opcional, estado del “bot” por número)  
  - id, company_id (FK), whatsapp_phone, last_command, context_extra (JSON), updated_at.

Reglas de negocio:

- La empresa tiene **miembros** (tabla `company_members`); los miembros se **crean desde el dashboard** (solo el **admin** puede crear cuentas con rol **accountant** o **driver**). Cada miembro requiere **email**; la autenticación es por **email**, con una **pantalla para establecer contraseña** (flujo de invitación: usuario nuevo recibe enlace, entra y define su contraseña).  
- Todas las consultas y escrituras del dashboard se filtran por `company_id` del **miembro** logueado (y según rol: admin, accountant, driver).  
- Un viaje solo se puede editar o recibir nuevos movimientos si `status = in_progress`.  
- Al cerrar viaje se setea `end_date` y `status = closed`.  
- Cálculo de totales: `total_income` / `total_expense` derivados de `movements` (o calculados en lectura).  
- Al crear un viaje desde el dashboard, el backend envía el mensaje de WhatsApp al conductor (trigger).

---

## 5. Flujo de viajes y WhatsApp

**Creación de viaje (operador → conductor)**

1. El **operador** crea el viaje en el **dashboard**: elige conductor, origen, destino, fecha inicio (y opcionalmente ingresos/gastos iniciales).  
2. Al guardar el viaje, el **backend** crea el registro con `status = in_progress` y **dispara un mensaje por WhatsApp** al conductor (ej.: “Tienes un nuevo viaje asignado: [origen] → [destino], inicio [fecha]. Responde por aquí para agregar gastos/ingresos o para cerrar el viaje al llegar.”).  
3. Opcional: geocoding con **Nominatim** (OpenStreetMap, gratis) para origen/destino y guardar lat/lng en el viaje.

**Flujo del conductor por WhatsApp**

1. **Registro**  
   - Conductor envía “Registro” o “Alta” + nombre.  
   - Sistema lo asocia al número de WhatsApp (y a la empresa si el operador ya lo vinculó, o se gestiona desde el dashboard).  
   - Respuesta en español: “Registrado. Recibirás tus viajes por aquí.”

2. **Durante el viaje** (solo para viajes asignados por el operador)  
   - “Agregar gasto [concepto] [monto]” / “Agregar ingreso [concepto] [monto]”.  
   - Backend valida que el viaje esté en curso y que el conductor sea el del viaje; inserta en `movements`.

3. **Cerrar viaje**  
   - Conductor: “Cerrar viaje” (y opcionalmente fecha fin).  
   - Backend setea `end_date`, `status = closed` y responde: “Viaje cerrado. No se permiten más cambios.”

Si el viaje ya está cerrado, cualquier intento de agregar gasto/ingreso o cerrar de nuevo recibe: “Este viaje ya está cerrado.”

---

## 6. API REST (FastAPI) – endpoints (en inglés)

Todas las rutas de la API en **inglés**; el contenido de respuestas y la UI del dashboard siguen en **español** para el usuario en México.

- **Auth (autenticación por email)**  
  - `POST /api/auth/login` – login con email + contraseña; devuelve token/sesión.  
  - `POST /api/auth/set-password` – establece contraseña (requiere token de invitación válido o enlace con token en query).  
  - `POST /api/auth/invite` (o flujo por correo con link) – el admin invita a un nuevo miembro (email); el backend genera token de invitación y opcionalmente envía correo con enlace a la pantalla “Establecer contraseña”.

- **Company members (solo admin)**  
  - `GET /api/companies/{id}/members` – lista de miembros de la empresa (admin).  
  - `POST /api/companies/{id}/members` – crear miembro (email + rol accountant | driver); requiere ser admin; dispara flujo de invitación (pantalla para establecer contraseña).

- **Companies** (si se exponen para admin multi-tenant)  
  - `GET /api/companies` – lista.  
  - `GET /api/companies/{id}` – detalle.

- **Drivers**  
  - `GET /api/drivers` – lista (filtros opcionales; scoped por company_id del usuario).  
  - `POST /api/drivers` – crear.  
  - `GET /api/drivers/{id}` – detalle.

- **Trips**  
  - `GET /api/trips` – lista con filtros: `start_date`, `end_date`, `driver_id`, `status` (scoped por company_id).  
  - `POST /api/trips` – crear por operador (status = in_progress); al crear, el backend **envía el mensaje WhatsApp al conductor**.  
  - `GET /api/trips/{id}` – detalle + movements (para pantalla de liquidación).  
  - `PATCH /api/trips/{id}` – actualizar solo si status = in_progress (incluye cerrar viaje).  
  - `POST /api/trips/{id}/movements` – agregar ingreso/gasto (solo si in_progress).

- **WhatsApp**  
  - `POST /webhook/whatsapp` – recibe mensajes entrantes; despacha a lógica de registro / movimientos / cerrar viaje y responde por WhatsApp.

- **Mapa / rutas**  
  - Los datos de ruta se sirven como JSON (origen/destino lat/lng o direcciones) desde la API; el frontend usa **Leaflet + OpenStreetMap** (gratis) para dibujar rutas (polyline; opcional OSRM para geometría) estilo Uber.

---

## 7. Dashboard web (pantallas)

1. **Dashboard de Control de Viajes** (lista principal)  
   - Filtros: rango de fechas del viaje, conductor, estado (en curso / cerrado).  
   - Tabla o cards: conductor, fechas, origen → destino, estado, total ingresos, total gastos, balance.  
   - Clic en un viaje → Detalle de liquidación.  
   - Botón o sección “Ver mapa” que lleva al mapa con las rutas.

2. **Gestión de miembros** (solo **admin**)  
   - Lista de miembros de la empresa (email, rol, estado: pendiente de contraseña / activo).  
   - Botón “Invitar miembro”: formulario con email y rol (**accountant** o **driver**). Al guardar, se crea el miembro y se muestra/envía enlace a la **pantalla para establecer contraseña**.  
   - Los miembros con contraseña definida inician sesión con **email + contraseña**.

3. **Pantalla “Establecer contraseña”**  
   - Acceso mediante enlace de invitación (token en URL o correo).  
   - Formulario: contraseña (y confirmación). Al enviar, se guarda `password_hash` del usuario y se considera activo; a partir de ahí puede hacer login con email + contraseña.

4. **Detalle de Liquidación de Viaje**  
   - Datos del viaje, conductor, fechas, origen/destino.  
   - Lista de ingresos y gastos; totales y balance.  
   - Si el viaje está en curso: botones para agregar gasto/ingreso y “Cerrar viaje”.  
   - Si está cerrado: solo lectura.

5. **Mapa de viajes**  
   - Mapa (Leaflet + OpenStreetMap) con viajes según filtros actuales.  
   - Cada viaje como ruta (línea) origen → destino; popup o panel lateral con resumen y enlace al detalle.  
   - Estilo “tipo Uber”: líneas claras y marcadores de inicio/fin.

Diseño: mobile-first, en español, alineado a los diseños de Stitch cuando se exporten (IDs indicados arriba).

---

## 8. Diseño Stitch (referencia)

- **Proyecto**: Dashboard de Control de Viajes (ID: 6788425370042734587).  
- **Pantalla de referencia**:  
  - **Dashboard de Control de Viajes** (ID: 0fae5761eb8740e892c91f076e00c452).

Se intentó descargar la pantalla con `curl -L` usando URLs típicas de exportación de Stitch; las URLs requieren autenticación y no están disponibles de forma pública. Para obtener la imagen y/o código:

1. Entra a [Stitch](https://stitch.withgoogle.com/) e inicia sesión.  
2. Abre el proyecto y la pantalla *Dashboard de Control de Viajes* (ID: 0fae5761eb8740e892c91f076e00c452).  
3. Exporta la pantalla (captura o HTML/código si está disponible).  
4. Si Stitch te da una URL de descarga pública, puedes usar: `curl -L <url> -o docs/design/dashboard-viajes.png` (o el nombre que prefieras).  
5. Guarda los archivos en `docs/design/` para que el frontend siga la misma estructura y textos en español.

La implementación del dashboard web debe alinearse a esta pantalla.

---

## 9. Orden de implementación sugerido

1. **Proyecto base**  
   - FastAPI, SQLAlchemy, PostgreSQL, estructura de carpetas, variables de entorno (`DATABASE_URL`).  
   - **Docker**: `docker-compose.yml` con PostgreSQL para pruebas locales.
Nota: crearas una api muy intuitiva pensando en que la complejidad para leer codigo sera baja pero el orden y los patrones se tendran que respetar

2. **Modelos y migraciones**  
   - Tablas: companies, **users**, **company_members**, drivers, trips, movements (y opcional whatsapp_sessions).  
   - Todas las tablas tenant-scoped con `company_id` donde aplique.  
   - Roles en company_members: admin, accountant, driver.  
   - Seed o script para datos de prueba (incluir al menos un admin por empresa).

3. **Auth y miembros**  
   - Login por email + contraseña; pantalla “Establecer contraseña” (token de invitación); endpoints de auth y de creación de miembros (admin).  
   - Todas las rutas del dashboard protegidas y filtradas por company_id del miembro logueado según su rol.

4. **API de drivers y trips (endpoints en inglés)**  
   - CRUD y filtros; scope por company_id; reglas de “solo edición si in_progress” y “no modificar closed”.  
   - Al crear trip (POST /api/trips), **trigger**: enviar mensaje WhatsApp al conductor.

5. **Webhook WhatsApp**  
   - Recibir mensajes, identificar conductor por número y company; intención (registro / agregar movimiento / cerrar viaje); respuestas en español.  
   - No crear viajes por WhatsApp (los crea el operador en el dashboard).

6. **Dashboard web**  
   - Lista de viajes con filtros (fecha, conductor, estado).  
   - Página/modal de detalle de liquidación.  
   - Gestión de miembros (admin): invitar accountant/driver, enlace a establecer contraseña.  
   - Pantalla “Establecer contraseña” (invitación).  
   - Todo en español y mobile-first.

7. **Mapa**  
   - Integración Leaflet + OpenStreetMap; capa de rutas por viaje (estilo Uber) usando datos de la API.

8. **Ajustes finales**  
   - Alinear UI a exportaciones de Stitch; pruebas con 1–2 usuarios; documentación de uso.

---

## 10. Consideraciones adicionales

- **Moneda**: MXN en BD y en mensajes (símbolo $ o “MXN”).  
- **Zona horaria**: America/Mexico_City para fechas/horas.  
- **Seguridad**: Autenticación del dashboard por **email + contraseña**. La empresa tiene **miembros** con roles (admin, accountant, driver); solo el **admin** puede crear miembros (accountant/driver) desde el dashboard. Los nuevos miembros requieren **email** y deben completar la **pantalla para establecer contraseña** (flujo de invitación con enlace/token) antes de poder iniciar sesión.  
- **WhatsApp**: Ver requisitos de Meta (número de negocio, aprobación de plantillas si se usan mensajes proactivos).  
- **Mapas**: **Leaflet + OpenStreetMap** en el frontend (sin API key); geocoding con **Nominatim** en el backend si se usa para origen/destino. Opcional: **OSRM** para geometría de rutas. Todo gratuito.  
- **Costos**: Mapas y geocoding gratuitos (OSM, Nominatim, OSRM). WhatsApp Business API tiene costos por mensaje según país.

Con este plan se puede empezar a codificar el backend en FastAPI y, en paralelo, preparar el frontend y la integración de WhatsApp y mapa. Si quieres, el siguiente paso puede ser generar el esqueleto del proyecto (FastAPI + SQLAlchemy + primeros endpoints) en este repositorio.


