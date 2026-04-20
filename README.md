# IUCE Reservas

Sistema de gestión de reservas de espacios del Instituto Universitario de Ciencias de la Educación (IUCE) de la Universidad de Salamanca.

Trabajo de Fin de Grado — Grado en Ingeniería Informática, Universidad de Burgos.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- PostgreSQL 16 + Prisma ORM
- Docker Compose para desarrollo local

## Requisitos

- Node.js 20+
- Docker y Docker Compose

## Puesta en marcha

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno
cp .env.example .env.local

# 3. Levantar la base de datos
docker-compose up -d

# 4. Generar cliente Prisma y aplicar el esquema
npm run db:push

# 5. Arrancar el servidor de desarrollo
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Arranca Next.js en modo desarrollo |
| `npm run build` | Genera el build de producción |
| `npm run start` | Arranca el build de producción |
| `npm run lint` | Ejecuta el linter |
| `npm run db:push` | Aplica el esquema Prisma a la base de datos |
| `npm run db:generate` | Regenera el cliente de Prisma |

## Estructura

```
.
├── prisma/
│   └── schema.prisma     # Modelos de datos
├── public/
│   └── images/           # Logos institucionales
├── src/
│   └── app/              # Rutas (App Router)
│       ├── layout.tsx
│       ├── page.tsx      # Landing page
│       └── globals.css
├── docker-compose.yml    # Postgres local
└── .env.example
```
