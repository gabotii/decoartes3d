# Decoartes3D

Tienda online de decoración impresa en 3D: catálogo público, carrito, compra como invitado o con cuenta,
seguimiento de pedidos y panel de administración.

| Parte | Tecnología |
|---|---|
| API | .NET 10, ASP.NET Core, EF Core, JWT, FluentValidation, Swagger |
| Base de datos | SQL Server (SQLite solo para desarrollo local) |
| Web | React 19, TypeScript, Vite, React Router, TanStack Query |
| Tests | xUnit + WebApplicationFactory |

## Arrancar en local

Necesitas el SDK de .NET 10 y Node 20 o superior.

**1. API** (en `backend/`):

```bash
# Sin SQL Server: base de datos SQLite en un archivo local
dotnet run --project Decoartes3D.API --launch-profile sqlite

# Con SQL Server / LocalDB (cadena de conexión en appsettings.Development.json)
dotnet run --project Decoartes3D.API --launch-profile http
```

Al arrancar en desarrollo se crea la base de datos con un catálogo de ejemplo y un administrador.

- API y Swagger: http://localhost:5217/swagger
- Admin de desarrollo: `admin@decoartes3d.local` / `Admin123!`

**2. Web** (en `frontend/decoartes3d-web/`):

```bash
npm install
npm run dev
```

Abre http://localhost:5173. Vite redirige `/api` a la API, así que no hace falta configurar CORS en desarrollo.

## Tests

```bash
cd backend
dotnet test
```

Los tests de integración levantan la API real sobre SQLite en memoria (no necesitan SQL Server).

## Estructura

```
backend/
  Decoartes3D.Domain/          Entidades, reglas (ciclo de vida del pedido), contratos de repositorio
  Decoartes3D.Application/     Servicios de negocio, DTOs, validadores
  Decoartes3D.Infrastructure/  EF Core, repositorios, JWT, BCrypt, datos iniciales, migraciones
  Decoartes3D.API/             Controladores, validación, errores (ProblemDetails), Swagger
  Decoartes3D.Tests/           Tests unitarios y de integración
frontend/decoartes3d-web/
  src/api/        Cliente HTTP y endpoints tipados
  src/contexts/   Sesión, carrito y avisos
  src/pages/      Tienda, cuenta de cliente y panel admin (carga diferida)
```

## Producción

- Configura `ConnectionStrings__DefaultConnection`, `Jwt__SecretKey` (32+ caracteres) y `Cors__AllowedOrigins__0`
  como variables de entorno; nunca en `appsettings.json`.
- Aplica las migraciones desde el despliegue:
  `dotnet ef database update --project Decoartes3D.Infrastructure --startup-project Decoartes3D.API`
- Compila la web con `npm run build` y sirve `dist/` detrás del mismo dominio que la API (o define `VITE_API_URL`).
- La tienda no integra pasarela de pago: el pedido queda en "Pendiente" y el pago se gestiona aparte.

<img width="1089" height="893" alt="image" src="https://github.com/user-attachments/assets/1d840f6b-ef81-4152-959a-c1682c7eee27" />
